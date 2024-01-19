import {combineReducers} from 'redux';
import createPostReducer from './reducers/createPost';
import walletReduecer from "./reducers/wallet"
import accountReducer from "./reducers/account"
import userAddressReducer from './reducers/userAddress';
import assetReducer from "./reducers/asset"
const rootReducer = combineReducers({
    createPost:createPostReducer,
    wallet:walletReduecer,
    account:accountReducer,
    userAddress:userAddressReducer,
    asset :assetReducer
    // all reducers go here
  });
  
  export type RootReducer = ReturnType<typeof rootReducer>;
  
  export default rootReducer;
  