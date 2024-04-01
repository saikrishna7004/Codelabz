import * as actions from "../../actions/actionTypes";

const initialState = {
  loading: false,
  error: null,
  data: [],
  replies: []
};

let existingIndex;

const CommentReducer = (state = initialState, { type, payload }) => {
  switch (type) {
    case actions.GET_COMMENT_DATA_START:
      return {
        ...state,
        loading: true
      };

    case actions.GET_COMMENT_DATA_SUCCESS:
      console.log(payload);
      return {
        ...state,
        loading: false,
        error: false,
        data: [...state.data, payload]
      };

    case actions.GET_COMMENT_DATA_FAIL:
      return {
        ...state,
        loading: false,
        error: payload
      };

    case actions.GET_REPLIES_START:
      return {
        ...state,
        loading: true
      };

    case actions.GET_REPLIES_SUCCESS:
      existingIndex = state.replies.findIndex(
        reply => reply.comment_id === payload.comment_id
      );
      console.log(existingIndex, "existing");

      if (existingIndex !== -1) {
        const updatedReplies = [...state.replies];
        updatedReplies[existingIndex] = {
          ...updatedReplies[existingIndex],
          replies: payload.replies
        };

        console.log("update 1", updatedReplies);

        return {
          ...state,
          loading: false,
          replies: updatedReplies
        };
      } else {
        const newReplies = {
          comment_id: payload.comment_id,
          replies: payload.replies
        };
        console.log("update 2", [...state.replies, newReplies]);

        return {
          ...state,
          loading: false,
          replies: [...state.replies, newReplies]
        };
      }

    case actions.ADD_COMMENT_START:
      return {
        ...state,
        loading: true
      };

    case actions.ADD_COMMENT_SUCCESS:
      return {
        ...state,
        loading: false
      };

    case actions.ADD_COMMENT_FAILED:
      return {
        ...state,
        loading: false,
        error: payload
      };

    default:
      return state;
  }
};

export default CommentReducer;
