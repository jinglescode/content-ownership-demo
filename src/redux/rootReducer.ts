import {combineReducers} from 'redux';
import createPostReducer from './reducers/createPost';
import walletReduecer from "./reducers/wallet"
import accountReducer from "./reducers/account"

const rootReducer = combineReducers({
    createPost:createPostReducer,
    wallet:walletReduecer,
    account:accountReducer
    // all reducers go here
  });
  
  export type RootReducer = ReturnType<typeof rootReducer>;
  
  export default rootReducer;
  