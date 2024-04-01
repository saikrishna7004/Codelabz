import * as actions from "../../actions/actionTypes";

const initialState = {
  loading: false,
  error: null
};

const TutorialLikesReducer = (state = initialState, action) => {
  switch (action.type) {
    case actions.ADD_TUTORIAL_LIKE_START:
      return {
        ...state,
        loading: true
      };
    case actions.ADD_TUTORIAL_LIKE_SUCCESS:
      return {
        ...state,
        loading: false
      };
    case actions.ADD_TUTORIAL_LIKE_FAILED:
      return {
        ...state,
        loading: false,
        error: action.payload
      };
    default:
      return state;
  }
};

export default TutorialLikesReducer;
