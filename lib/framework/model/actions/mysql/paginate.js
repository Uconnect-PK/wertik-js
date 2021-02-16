"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
let { get } = require("lodash");
const convertFiltersIntoSequalizeObject_1 = __importDefault(require("./../../../database/mysql/convertFiltersIntoSequalizeObject"));
function default_1(model, args = {}, requestedFields = []) {
    return __awaiter(this, void 0, void 0, function* () {
        let baseFields = "*";
        let attributesObject = {};
        if (requestedFields.constructor === Array) {
            baseFields = requestedFields;
            attributesObject["attributes"] = baseFields;
        }
        let sorting = get(args, "sorting", []);
        let sortingObject = {
            order: sorting.map(c => {
                return [c.column, c.type];
            })
        };
        let page = get(args, "pagination.page", 1);
        let limit = get(args, "pagination.limit", 10);
        let filters = get(args, "filters", []);
        let convertedFilters = yield convertFiltersIntoSequalizeObject_1.default(filters);
        let offset = limit * (page - 1);
        let totalFilters = filters.length;
        let list = {};
        if (baseFields == "*") {
            delete attributesObject["attributes"];
        }
        if (sorting.length == 0) {
            delete sortingObject["sorting"];
        }
        if (totalFilters > 0) {
            list = yield model.findAndCountAll(Object.assign({ offset: offset, limit: limit, where: convertedFilters }, attributesObject, sortingObject));
        }
        else {
            list = yield model.findAndCountAll(Object.assign({ offset: offset, limit: limit }, attributesObject, sortingObject));
        }
        return {
            filters,
            pagination: { page, limit },
            list: list.rows,
            paginationProperties: {
                total: list.count,
                nextPage: page + 1,
                page: page,
                previousPage: page == 1 ? 1 : page - 1,
                pages: Math.ceil(list.count / limit)
            }
        };
    });
}
exports.default = default_1;
//# sourceMappingURL=paginate.js.map