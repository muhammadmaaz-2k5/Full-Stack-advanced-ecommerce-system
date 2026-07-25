const { supabase } = require("../database/db");

// Helper to decorate returned database items with a simple .toObject() method
function decorateRecord(item) {
    if (!item || typeof item !== "object") return item;
    if (Array.isArray(item)) return item.map(decorateRecord);

    // Strip password from populated users if present
    if (item.user && typeof item.user === "object" && item.user.password) {
        delete item.user.password;
    }

    Object.defineProperty(item, "toObject", {
        value: function () {
            const copy = { ...this };
            delete copy.toObject;
            return copy;
        },
        writable: true,
        enumerable: false,
        configurable: true
    });
    return item;
}

// Helper to translate Mongoose populate parameter into Supabase PostgREST select string
function buildSelectString(baseSelect, populateParams) {
    let selects = [baseSelect || '*'];
    if (!populateParams || populateParams.length === 0) return selects.join(', ');

    populateParams.forEach(param => {
        if (!param) return;
        const pPath = typeof param === 'string' ? param : param.path;
        const subPopulate = param.populate;

        if (pPath === 'brand') {
            selects.push('brand:brands(*)');
        } else if (pPath === 'category') {
            selects.push('category:categories(*)');
        } else if (pPath === 'user') {
            selects.push('user:users(_id, name, email, isVerified, isAdmin, createdAt)');
        } else if (pPath === 'product') {
            if (subPopulate && (subPopulate === 'brand' || (subPopulate.path === 'brand') || (Array.isArray(subPopulate) && subPopulate.includes('brand')))) {
                selects.push('product:products(*, brand:brands(*), category:categories(*))');
            } else {
                selects.push('product:products(*)');
            }
        }
    });

    return selects.join(', ');
}

class SupabaseQuery {
    constructor(tableName, isSingle = false) {
        this.tableName = tableName;
        this.isSingle = isSingle;
        this.filters = [];
        this.sortRules = [];
        this.skipCount = 0;
        this.limitCount = 0;
        this.populateParams = [];
        this.isCountOnly = false;
        this.isDelete = false;
        this.isUpdate = false;
        this.updateData = null;
    }

    sort(sortObj) {
        if (sortObj) {
            Object.keys(sortObj).forEach(key => {
                const val = sortObj[key];
                const asc = val === 1 || val === 'asc' || val === 'ascending';
                this.sortRules.push({ column: key, ascending: asc });
            });
        }
        return this;
    }

    skip(num) {
        this.skipCount = Number(num) || 0;
        return this;
    }

    limit(num) {
        this.limitCount = Number(num) || 0;
        return this;
    }

    populate(param) {
        if (param) this.populateParams.push(param);
        return this;
    }

    countDocuments() {
        this.isCountOnly = true;
        return this;
    }

    async exec() {
        if (this.isCountOnly) {
            let q = supabase.from(this.tableName).select('_id', { count: 'exact', head: true });
            this.applyFilters(q);
            const { count, error } = await q;
            if (error) {
                console.error(`ORM count error on ${this.tableName}:`, error.message);
                return 0;
            }
            return count || 0;
        }

        if (this.isDelete) {
            let q = supabase.from(this.tableName).delete().select();
            this.applyFilters(q);
            const { data, error } = await q;
            if (error) {
                console.error(`ORM delete error on ${this.tableName}:`, error.message);
                throw error;
            }
            if (this.isSingle) return decorateRecord(data ? data[0] : null);
            return decorateRecord(data || []);
        }

        if (this.isUpdate) {
            // First perform update
            const cleanData = { ...this.updateData };
            delete cleanData._id;
            delete cleanData.toObject;
            // flatten populated relations back to strings if needed
            Object.keys(cleanData).forEach(key => {
                if (cleanData[key] && typeof cleanData[key] === 'object' && cleanData[key]._id && key !== 'item' && key !== 'address') {
                    cleanData[key] = cleanData[key]._id;
                }
            });

            let q = supabase.from(this.tableName).update(cleanData);
            this.applyFilters(q);
            const { error: updErr } = await q;
            if (updErr) {
                console.error(`ORM update error on ${this.tableName}:`, updErr.message);
                throw updErr;
            }

            // After update, select the updated row with populates
            const selectStr = buildSelectString('*', this.populateParams);
            let selectQ = supabase.from(this.tableName).select(selectStr);
            this.applyFilters(selectQ);
            const { data, error: selErr } = await selectQ;
            if (selErr) {
                console.error(`ORM post-update select error on ${this.tableName}:`, selErr.message);
                throw selErr;
            }
            return decorateRecord(data ? data[0] : null);
        }

        const selectStr = buildSelectString('*', this.populateParams);
        let q = supabase.from(this.tableName).select(selectStr);
        this.applyFilters(q);

        this.sortRules.forEach(rule => {
            q = q.order(rule.column, { ascending: rule.ascending });
        });

        if (this.skipCount > 0 || this.limitCount > 0) {
            const start = this.skipCount;
            const end = this.limitCount > 0 ? start + this.limitCount - 1 : undefined;
            if (end !== undefined) {
                q = q.range(start, end);
            } else {
                q = q.limit(this.limitCount);
            }
        } else if (this.limitCount > 0) {
            q = q.limit(this.limitCount);
        }

        if (this.isSingle && this.limitCount === 0) {
            q = q.limit(1);
        }

        const { data, error } = await q;
        if (error) {
            console.error(`ORM select error on ${this.tableName}:`, error.message);
            if (this.isSingle) return null;
            return [];
        }

        if (this.isSingle) {
            return decorateRecord(data ? data[0] : null);
        }
        return decorateRecord(data || []);
    }

    applyFilters(q) {
        this.filters.forEach(({ col, op, val }) => {
            if (op === 'eq') q = q.eq(col, val);
            else if (op === 'in') q = q.in(col, val);
            else if (op === 'ne') q = q.neq(col, val);
            else if (op === 'gt') q = q.gt(col, val);
            else if (op === 'gte') q = q.gte(col, val);
            else if (op === 'lt') q = q.lt(col, val);
            else if (op === 'lte') q = q.lte(col, val);
        });
        return q;
    }

    then(resolve, reject) {
        return this.exec().then(resolve, reject);
    }
}

class ORMInstance {
    constructor(tableName, data = {}) {
        Object.defineProperty(this, "tableName", { value: tableName, enumerable: false, writable: true });
        Object.defineProperty(this, "populateParams", { value: [], enumerable: false, writable: true });
        Object.assign(this, data);
        decorateRecord(this);
    }

    async populate(param) {
        if (param) this.populateParams.push(param);
        // If this record already exists in DB (has _id), fetch populated data
        if (this._id) {
            const selectStr = buildSelectString('*', this.populateParams);
            const { data, error } = await supabase.from(this.tableName).select(selectStr).eq('_id', this._id).limit(1);
            if (!error && data && data[0]) {
                Object.assign(this, data[0]);
            }
        }
        return this;
    }

    async save() {
        const insertData = { ...this };
        delete insertData.toObject;
        delete insertData.__v;
        if ('stockQuantityQuantity' in insertData) {
            if (!('stockQuantity' in insertData)) insertData.stockQuantity = insertData.stockQuantityQuantity;
            delete insertData.stockQuantityQuantity;
        }
        
        // Flatten relationship objects to primary key strings for database insert
        Object.keys(insertData).forEach(key => {
            if (insertData[key] && typeof insertData[key] === 'object' && insertData[key]._id && key !== 'item' && key !== 'address') {
                insertData[key] = insertData[key]._id;
            }
        });

        const { data, error } = await supabase.from(this.tableName).insert(insertData).select().single();
        if (error) {
            console.error(`ORM save error on ${this.tableName}:`, error.message);
            throw error;
        }

        Object.assign(this, data);

        if (this.populateParams.length > 0) {
            await this.populate();
        }

        return decorateRecord(this);
    }
}

class BaseModel {
    constructor(tableName) {
        this.tableName = tableName;
        // Make calling `new Model(data)` return an ORMInstance directly via Proxy/Constructor wrapper
        return new Proxy(function () {}, {
            construct: (target, args) => new ORMInstance(tableName, args[0] || {}),
            get: (target, prop) => this[prop]
        });
    }

    find(filter = {}) {
        const query = new SupabaseQuery(this.tableName, false);
        this.parseFilter(query, filter);
        return query;
    }

    findOne(filter = {}) {
        const query = new SupabaseQuery(this.tableName, true);
        this.parseFilter(query, filter);
        return query;
    }

    findById(id) {
        const query = new SupabaseQuery(this.tableName, true);
        query.filters.push({ col: '_id', op: 'eq', val: id });
        return query;
    }

    findByIdAndUpdate(id, updateData, options = {}) {
        const query = new SupabaseQuery(this.tableName, true);
        query.isUpdate = true;
        query.updateData = updateData;
        query.filters.push({ col: '_id', op: 'eq', val: id });
        return query;
    }

    findByIdAndDelete(id) {
        const query = new SupabaseQuery(this.tableName, true);
        query.isDelete = true;
        query.filters.push({ col: '_id', op: 'eq', val: id });
        return query;
    }

    async deleteMany(filter = {}) {
        let q = supabase.from(this.tableName).delete();
        const keys = Object.keys(filter);
        if (keys.length === 0) {
            // Match all rows by check against non-empty string or impossible UUID to delete entire table contents
            q = q.neq('_id', '00000000-0000-0000-0000-000000000000');
        } else {
            const tempQuery = new SupabaseQuery(this.tableName, false);
            this.parseFilter(tempQuery, filter);
            tempQuery.filters.forEach(({ col, op, val }) => {
                if (op === 'eq') q = q.eq(col, val);
                else if (op === 'in') q = q.in(col, val);
                else if (op === 'ne') q = q.neq(col, val);
            });
        }
        const { data, error } = await q;
        if (error) console.error(`ORM deleteMany error on ${this.tableName}:`, error.message);
        return data || [];
    }

    async insertMany(items = []) {
        if (!items || items.length === 0) return [];
        const cleanItems = items.map(it => {
            const c = { ...it };
            delete c.toObject;
            delete c.__v;
            if ('stockQuantityQuantity' in c) {
                if (!('stockQuantity' in c)) c.stockQuantity = c.stockQuantityQuantity;
                delete c.stockQuantityQuantity;
            }
            Object.keys(c).forEach(key => {
                if (c[key] && typeof c[key] === 'object' && c[key]._id && key !== 'item' && key !== 'address') {
                    c[key] = c[key]._id;
                }
            });
            return c;
        });
        const { data, error } = await supabase.from(this.tableName).upsert(cleanItems).select();
        if (error) {
            console.error(`ORM insertMany error on ${this.tableName}:`, error.message);
            throw error;
        }
        return decorateRecord(data || []);
    }

    parseFilter(query, filter) {
        if (!filter || typeof filter !== 'object') return;
        Object.keys(filter).forEach(col => {
            const val = filter[col];
            if (val && typeof val === 'object' && !Array.isArray(val) && val._id && col !== 'item' && col !== 'address') {
                query.filters.push({ col, op: 'eq', val: val._id });
            } else if (val && typeof val === 'object' && !Array.isArray(val)) {
                if ('$in' in val) query.filters.push({ col, op: 'in', val: val.$in });
                else if ('$ne' in val) query.filters.push({ col, op: 'ne', val: val.$ne });
                else if ('$gt' in val) query.filters.push({ col, op: 'gt', val: val.$gt });
                else if ('$gte' in val) query.filters.push({ col, op: 'gte', val: val.$gte });
                else if ('$lt' in val) query.filters.push({ col, op: 'lt', val: val.$lt });
                else if ('$lte' in val) query.filters.push({ col, op: 'lte', val: val.$lte });
                else query.filters.push({ col, op: 'eq', val: JSON.stringify(val) });
            } else {
                query.filters.push({ col, op: 'eq', val });
            }
        });
    }
}

module.exports = { BaseModel, decorateRecord };
