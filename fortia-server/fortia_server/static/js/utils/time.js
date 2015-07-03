
/* Return Date object from a timestamp returned by Python's time.time() */
export function parsePythonTimestamp(ts) {
    if (!ts) {
        return;
    }
    return new Date(ts*1000);
}
