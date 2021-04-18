import { handlerPath } from '../../libs/handlerResolver';

export default {
  handler: `${handlerPath(__dirname)}/handler.mainGetGroups`,
  events: [
    {
      http: {
        method: 'get',
        path: 'getGroups',
      },
    },
  ],
};
