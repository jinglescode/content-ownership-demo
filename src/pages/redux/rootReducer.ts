import {combineReducers} from 'redux';
import createPostReducer from './reducers/createPost';

const rootReducer = combineReducers({
    createPost:createPostReducer
    // all reducers go here
  });
  
  export type RootReducer = ReturnType<typeof rootReducer>;
  
  export default rootReducer;
  