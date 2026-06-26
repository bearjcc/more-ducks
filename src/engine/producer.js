import Entity from "./entity.js";

export default class Producer extends Entity {
    constructor(opts) {
        super("producer", opts);
        this.state.baseCost = opts.baseCost;
        this.state.costCoefficient = opts.costCoefficient || 1;
        this.state.consumedInputs = {};
        this.state.processingEnabled = (typeof opts.processingEnabled === 'boolean' ? opts.processingEnabled : true);
        this.inputs = opts.inputs || {};
        this.outputs = opts.outputs || { resources: {}, producers: {} };
        // set the 'lastProcessed' timestamp to creation time
        if ( this.state.processingEnabled === true ) {
            for (const type in this.outputs) {
                for (const key in this.outputs[type]) {
                    this.outputs[type][key].lastProcessed = Date.now();
                }
            }
        }

        this.postProcessors = opts.postProcessors;
    }

    get baseCost() {
        return this.state.baseCost;
    }

    get costCoefficient() {
        return this.state.costCoefficient;
    }

    get consumedInputs() {
        return this.state.consumedInputs;
    }

    get processingEnabled() {
        return this.state.processingEnabled;
    }

    set processingEnabled(flag) {
        if (typeof flag === 'boolean') {
            if ( flag !== this.state.processingEnabled ) {
                this.state.processingEnabled = flag;
                for (const key in this.outputs.resources) {
                    this.outputs.resources[key].lastProcessed = flag ? Date.now() : null;
                }
            }
        } else {
            throw `Invalid value ${flag} passed as value to Producer.processingEnabled`;
        }
    }

    resetTimers() {
        for (const type in this.inputs) {
            for (const key in this.inputs[type]) {
                delete this.inputs[type][key].lastProcessed;
            }
        }
        for (const type in this.outputs) {
            for (const key in this.outputs[type]) {
                delete this.outputs[type][key].lastProcessed;
            }
        }
    }

    calculateCost(count) {
        let cost = null;

        if (this.state.baseCost) {
            cost = { currency: this.state.baseCost.currency, price: 0 };
            for (let i = 0; i < count; i++) {
                cost.price += Math.round(this.state.baseCost.amount * Math.pow(this.state.costCoefficient, this.state.count + i));
            }
        }
        return cost;
    }

    addOutput(outputType, outputKey, productionTime, productionAmount) {
        outputType += 's';
        this.outputs[outputType] = this.outputs[outputType] || {};
        this.outputs[outputType][outputKey] = this.outputs[outputType][outputKey] || {};
        this.outputs[outputType][outputKey].productionTime = productionTime;
        this.outputs[outputType][outputKey].productionAmount = productionAmount;

        return this;
    }

    getOutput(outputType, outputKey) {
        let result = null;
        if (this.outputs[outputType]) {
            result = this.outputs[outputType][outputKey];
        }
        return result;
    }

    processTick(dt) {
        const result = this.state.consumedInputs;

        const consumeInput = (cat, input) => {
            const rules = this.inputs[cat][input];
            const lastProcessed = rules.lastProcessed;
            const obj = this.engine[cat][input];

            if (!lastProcessed) { rules.lastProcessed = dt; return; }
            if (!obj) throw `Input object not found:\n\tType: ${cat}\n\tKey: ${input}`;
            if (!(rules.consumptionTime > 0 && dt - lastProcessed >= rules.consumptionTime)) return;

            const consumeBy = Math.min(obj.count, this.state.count * rules.consumptionAmount * Math.trunc((dt - lastProcessed) / rules.consumptionTime));
            obj.incrementBy(-consumeBy);
            if (consumeBy) {
                result[cat] = result[cat] || {};
                result[cat][input] = result[cat][input] || { amount: 0 };
                result[cat][input].amount += consumeBy;
            }
            rules.lastProcessed = dt;
        };

        const inputRequirementsMet = (reqs) => {
            if (!reqs) return true;
            for (const rc of reqs) {
                const pool = this.state.consumedInputs[rc.category]?.[rc.key];
                if (!pool || pool.amount < rc.amount) return false;
            }
            return true;
        };

        const clampByConsumedInputs = (count, reqs) => {
            if (!reqs) return count;
            for (const rc of reqs) {
                const maxConsumable = Math.min(count * rc.amount, this.state.consumedInputs[rc.category][rc.key].amount);
                if (maxConsumable >= rc.amount) count = Math.min(count, maxConsumable / rc.amount);
            }
            return count;
        };

        const reduceConsumpedInputsBy = (count, reqs) => {
            if (!reqs) return;
            for (const rc of reqs) this.state.consumedInputs[rc.category][rc.key].amount -= count * rc.amount;
        };

        const produceOutput = (cat, output) => {
            const rules = this.outputs[cat][output];
            const lastProcessed = rules.lastProcessed;
            const obj = this.engine[cat][output];

            if (!lastProcessed) { rules.lastProcessed = dt; return; }
            if (!obj) throw `Output object not found:\n\tType: ${cat}\n\tKey: ${output}`;
            if (!(rules.productionTime > 0 && dt - lastProcessed >= rules.productionTime)) return;
            if (!inputRequirementsMet(rules.inputRequirements)) return;

            const timeMultiple = Math.trunc((dt - lastProcessed) / rules.productionTime);
            const clampedCount = clampByConsumedInputs(this.state.count * timeMultiple, rules.inputRequirements);
            const incrementBy = clampedCount * rules.productionAmount;

            reduceConsumpedInputsBy(clampedCount, rules.inputRequirements);
            if (obj.incrementBy(incrementBy) != 0) {
                this.emit("PRODUCER_OUTPUT", { producer: this, output: obj, delta: incrementBy });
            }
            rules.lastProcessed = dt;
        };

        if (!this.state.processingEnabled) return;

        for (const cat in this.inputs) {
            for (const input in this.inputs[cat]) consumeInput(cat, input);
        }
        if (this.state.count > 0) {
            for (const cat in this.outputs) {
                for (const output in this.outputs[cat]) produceOutput(cat, output);
            }
        }
        if (this.postProcessors) {
            for (const pp in this.postProcessors) {
                const { stack, func } = this.postProcessors[pp];
                if (func) func(this, stack || null);
            }
        }
    }
}