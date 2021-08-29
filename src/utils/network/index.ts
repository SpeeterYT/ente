import { sleep } from 'utils/common';

const retrySleepTimeInMilliSeconds = [2000, 5000, 10000];

export async function retryAsyncFunction(
    func: () => Promise<any>,
    checkForBreakingError?: (error) => void
) {
    const retrier = async (
        func: () => Promise<any>,
        attemptNumber: number = 0
    ) => {
        try {
            const resp = await func();
            return resp;
        } catch (e) {
            if (checkForBreakingError) {
                try {
                    checkForBreakingError(e);
                } catch (err) {
                    throw e;
                }
            }
            if (attemptNumber < retrySleepTimeInMilliSeconds.length) {
                await sleep(retrySleepTimeInMilliSeconds[attemptNumber]);
                await retrier(func, attemptNumber + 1);
            } else {
                throw e;
            }
        }
    };
    return await retrier(func);
}
