import * as actions from "../../actions/actionTypes";

const initialState = {
  loading: false,
  error: null,
  userVote: null
};

const CommentVoteReducer = (state = initialState, action) => {
  switch (action.type) {
    case actions.GET_COMMENT_VOTE_START:
      return {
        ...state,
        loading: true
      };
    case actions.GET_COMMENT_VOTE_SUCCESS:
      return {
        ...state,
        loading: false,
        userVote: action.payload,
        error: null
      };
    case actions.GET_COMMENT_VOTE_FAILED:
      return {
        ...state,
        loading: false,
        userVote: 0,
        error: action.payload
      };
    default:
      return state;
  }
};

export default CommentVoteReducer;
