/* A wrapper for fortia-server HTTP API */


export function getJobItems (jobId, lastId) {
    var url = "/jobs/items/" + jobId;
    if (lastId){
        url += "?last_id=" + lastId;
    }
    return $.ajax(url, {});
}

