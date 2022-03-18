"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
exports.__esModule = true;
exports.useJobsQuery = void 0;
var use_network_1 = require("@/hooks/use-network");
var query_keys_1 = require("@/config/query-keys");
var react_query_1 = require("react-query");
var shallow_1 = require("zustand/shallow");
var pagination_1 = require("@/stores/pagination");
var network_settings_1 = require("@/stores/network-settings");
var refetch_jobs_lock_1 = require("@/stores/refetch-jobs-lock");
var utils_1 = require("jotai/utils");
var workspaces_1 = require("@/atoms/workspaces");
var use_websocket_1 = require("@/hooks/use-websocket");
exports.useJobsQuery = function () {
    var getJobs = use_network_1.useNetwork().queries.getJobs;
    var page = utils_1.useAtomValue(workspaces_1.activePageAtom);
    var perPage = pagination_1.usePaginationStore(function (state) { return state.perPage; });
    var status = utils_1.useAtomValue(workspaces_1.activeStatusAtom);
    var queue = utils_1.useAtomValue(workspaces_1.activeQueueAtom);
    var order = utils_1.useAtomValue(workspaces_1.jobsOrderAtom);
    var jobId = utils_1.useAtomValue(workspaces_1.jobIdAtom);
    var dataSearch = utils_1.useAtomValue(workspaces_1.dataSearchAtom);
    var isFetchLocked = refetch_jobs_lock_1.useRefetchJobsLockStore(function (state) { return state.isLocked; });
    var _a = network_settings_1.useNetworkSettingsStore(function (state) { return [state.shouldFetchData, state.textSearchPollingDisabled]; }, shallow_1["default"]), shouldFetchData = _a[0], textSearchPollingDisabled = _a[1];
    var refetchInterval = network_settings_1.getPollingInterval();
    var queryKey = [
        query_keys_1.QueryKeysConfig.jobsList,
        {
            queue: queue,
            perPage: perPage,
            page: page,
            status: status,
            order: order,
            id: jobId,
            dataSearch: dataSearch,
            shouldFetchData: shouldFetchData
        }
    ];
    var queryClient = react_query_1.useQueryClient();
    var mutation = react_query_1.useMutation(function (params) { return __awaiter(void 0, void 0, void 0, function () {
        return __generator(this, function (_a) {
            queryClient.setQueryData(queryKey, function (old) {
                var jobs = [];
                for (var index = 0; index < old.jobs.length; index++) {
                    var job = old.jobs[index];
                    if (job.id === params.job.id) {
                        if (params.action === 'delete')
                            continue;
                        else if (params.action === 'update') {
                            jobs.push({
                                id: params.job.id,
                                progress: params.job.progress,
                                attemptsMade: params.job.attemptsMade,
                                failedReason: job.failedReason,
                                status: job.status || params.job.status,
                                stacktrace: params.job.stacktrace,
                                timestamp: params.job.timestamp,
                                returnValue: params.job.returnvalue,
                                finishedOn: params.job.finishedOn,
                                processedOn: params.job.processedOn,
                                processingTime: params.job.processingTime || job.processingTime,
                                name: params.job.name,
                                opts: JSON.stringify(params.job.opts),
                                delay: params.job.deplay
                            });
                        }
                    }
                }
                return { jobs: jobs };
            });
            return [2 /*return*/];
        });
    }); });
    var listen = use_websocket_1.useWebsocket().listen;
    return react_query_1.useQuery(queryKey, function () { return getJobs({
        queue: queue,
        limit: perPage,
        offset: page * perPage,
        status: status,
        order: order,
        id: jobId,
        fetchData: shouldFetchData,
        dataSearch: dataSearch
    }).then(function (query) {
        console.log('query', query);
        listen.jobStatus(mutation, status);
        return query;
    }); }, {
        keepPreviousData: true,
        enabled: Boolean(queue),
        refetchInterval: isFetchLocked || (textSearchPollingDisabled && dataSearch)
            ? false
            : refetchInterval
    });
};
