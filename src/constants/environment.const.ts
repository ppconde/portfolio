export const ENVIRONMENT = import.meta.env.PROD ? {
    workerBucketUrl: 'https://portfolio-bucket-worker.pepconde-1993.workers.dev/'
} : {
    workerBucketUrl: 'http://localhost:8787'
};
