import { combineReducers } from "redux";
import PostReducer from "./postReducer";
import CommentReducer from "./commentReducer";
import FeedReducer from "./feedReducer";
import TutorialVoteReducer from "./tutorialVoteReducer";

export default combineReducers({
  post: PostReducer,
  comment: CommentReducer,
  feed: FeedReducer,
  userVote: TutorialVoteReducer
});
