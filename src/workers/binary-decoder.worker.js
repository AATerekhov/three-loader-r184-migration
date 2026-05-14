import { handleMessage } from './binary-decoder-worker-internal';

/*eslint-disable */
self.onmessage = handleMessage;
