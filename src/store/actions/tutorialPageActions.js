import * as actions from "./actionTypes";

export const getTutorialFeedIdArray = uid => async (_, firestore) => {
  try {
    let followings = [];
    if (uid) {
      followings = await firestore
        .collection("user_followers")
        .where("followerId", "==", uid)
        .where("isPublished", "==", true)
        .get()
        .then(async docs => {
          const result = [];
          for (const doc of docs.docs) {
            const handle = await firestore
              .collection("cl_user")
              .doc(doc.data().followingId)
              .get()
              .then(doc => doc.data().handle);

            result.push(handle);
          }
          return result;
        });
    }
    let followingUsersTutorials = [];
    if (followings.length > 0) {
      followingUsersTutorials = await firestore
        .collection("tutorials")
        .where("created_by", "in", followings)
        .where("isPublished", "==", true)
        .limit(50)
        .get()
        .then(docs => {
          const tutorialsArray = [];
          docs.docs.map(doc => {
            const tutorialId = doc.id;
            tutorialsArray.push(tutorialId);
          });
          return tutorialsArray;
        });
    }
    let newTutorials = [];
    if (followings.length > 0) {
      newTutorials = await firestore
        .collection("tutorials")
        .where("created_by", "not-in", followings)
        .where("isPublished", "==", true)
        .limit(50)
        .get()
        .then(docs => {
          const tutorialsArray = [];
          docs.docs.map(doc => {
            const tutorialId = doc.id;
            tutorialsArray.push(tutorialId);
          });
          return tutorialsArray;
        });
    } else {
      newTutorials = await firestore
        .collection("tutorials")
        .where("isPublished", "==", true)
        .limit(50)
        .get()
        .then(docs => {
          const tutorialsArray = [];
          docs.docs.map(doc => {
            const tutorialId = doc.id;
            tutorialsArray.push(tutorialId);
          });
          return tutorialsArray;
        });
    }

    const tutorials = followingUsersTutorials.concat(newTutorials);

    return tutorials;
  } catch (e) {
    console.log(e);
  }
};

export const getTutorialFeedData =
  tutorialIdArray => async (firebase, firestore, dispatch) => {
    try {
      dispatch({ type: actions.GET_TUTORIAL_FEED_START });
      const tutorials = await firestore
        .collection("tutorials")
        .where("tutorial_id", "in", tutorialIdArray)
        .get();
      if (tutorials.empty) {
        dispatch({ type: actions.GET_TUTORIAL_FEED_SUCCESS, payload: [] });
      } else {
        const feed = tutorials.docs.map(doc => {
          const tutorial = doc.data();
          const tutorialData = {
            tutorial_id: tutorial?.tutorial_id,
            title: tutorial?.title,
            summary: tutorial?.summary,
            owner: tutorial?.owner,
            created_by: tutorial?.created_by,
            createdAt: tutorial?.createdAt,
            featured_image: tutorial?.featured_image
          };
          return tutorialData;
        });
        dispatch({ type: actions.GET_TUTORIAL_FEED_SUCCESS, payload: feed });
      }
    } catch (e) {
      dispatch({ type: actions.GET_TUTORIAL_FEED_FAILED, payload: e });
    }
  };

export const getTutorialData =
  tutorialID => async (firebase, firestore, dispatch) => {
    try {
      dispatch({ type: actions.GET_POST_DATA_START });
      const data = await firestore
        .collection("tutorials")
        .doc(tutorialID)
        .get();
      const tutorial = data.data();
      dispatch({ type: actions.GET_POST_DATA_SUCCESS, payload: tutorial });
    } catch (e) {
      dispatch({ type: actions.GET_POST_DATA_FAIL });
      console.log(e);
    }
  };

export const getTutorialSteps =
  tutorialID => async (firebase, firestore, dispatch) => {
    try {
      dispatch({ type: actions.GET_STEPS_DATA_START });
      const data = await firestore
        .collection("tutorials")
        .doc(tutorialID)
        .collection("steps")
        .get()
        .then(querySnapshot => {
          let steps = [];
          querySnapshot.forEach(doc => {
            steps.push(doc.data());
          });
          return steps;
        });
      dispatch({ type: actions.GET_STEPS_DATA_SUCCESS, payload: data });
    } catch (e) {
      dispatch({ type: actions.GET_STEPS_DATA_FAIL, payload: e });
      console.log(e);
    }
  };

export const getCommentData =
  commentId => async (firebase, firestore, dispatch) => {
    try {
      dispatch({ type: actions.GET_COMMENT_DATA_START });
      const data = await firestore
        .collection("cl_comments")
        .doc(commentId)
        .get();
      const comment = data.data();
      dispatch({ type: actions.GET_COMMENT_DATA_SUCCESS, payload: comment });
    } catch (e) {
      dispatch({ type: actions.GET_COMMENT_DATA_FAIL });
      console.log(e);
    }
  };

export const getCommentReply =
  commentId => async (firebase, firestore, dispatch) => {
    try {
      console.log("commentId", commentId);
      dispatch({ type: actions.GET_REPLIES_START });
      console.log("Get replies");
      const replies = await firestore
        .collection("cl_comments")
        .where("replyTo", "==", commentId)
        .get()
        .then(querySnapshot => {
          let data = [];
          querySnapshot.forEach(doc => {
            data.push(doc.data().comment_id);
          });
          return data;
        });
      console.log(replies);
      dispatch({
        type: actions.GET_REPLIES_SUCCESS,
        payload: { replies, comment_id: commentId }
      });
    } catch (e) {
      console.log(e);
    }
  };

export const addComment = comment => async (firebase, firestore, dispatch) => {
  try {
    dispatch({ type: actions.ADD_COMMENT_START });
    await firestore
      .collection("cl_comments")
      .add(comment)
      .then(async docref => {
        await firestore.collection("cl_comments").doc(docref.id).update({
          comment_id: docref.id
        });
        if (comment.replyTo == comment.tutorial_id) {
          await firestore
            .collection("tutorials")
            .doc(comment.tutorial_id)
            .update({
              comments: firebase.firestore.FieldValue.arrayUnion(docref.id)
            });
        }
        await dispatch(getCommentReply(docref.id));
      })
      .then(() => {
        dispatch({ type: actions.ADD_COMMENT_SUCCESS });
      });
  } catch (e) {
    dispatch({ type: actions.ADD_COMMENT_FAILED, payload: e.message });
  }
};

export const addTutorialLike =
  (uid, tut_id, value) => async (firebase, firestore, dispatch) => {
    try {
      dispatch({ type: actions.ADD_TUTORIAL_LIKE_START });

      const existingLikeRef = await firestore
        .collection("tutorial_likes")
        .where("uid", "==", uid)
        .where("tut_id", "==", tut_id)
        .get();

      if (!existingLikeRef.empty) {
        const existingLike = existingLikeRef.docs[0];
        const existingLikeValue = existingLike.data().value;

        if (existingLikeValue === value) {
          dispatch({ type: actions.ADD_TUTORIAL_LIKE_SUCCESS });
          return;
        }

        const tutorialRef = firestore.collection("tutorials").doc(tut_id);
        const tutorialDoc = await tutorialRef.get();
        const currentUpVotes = tutorialDoc.data().upVotes || 0;
        const currentDownVotes = tutorialDoc.data().downVotes || 0;

        let updatedUpVotes = currentUpVotes;
        let updatedDownVotes = currentDownVotes;

        if (value === 1) {
          updatedUpVotes += 1;
          if (existingLikeValue === -1) {
            updatedDownVotes -= 1;
          }
        } else {
          updatedDownVotes += 1;
          if (existingLikeValue === 1) {
            updatedUpVotes -= 1;
          }
        }

        await Promise.all([
          tutorialRef.update({
            upVotes: updatedUpVotes,
            downVotes: updatedDownVotes
          }),
          existingLike.ref.update({ value })
        ]);
      } else {
        await Promise.all([
          firestore.collection("tutorial_likes").add({ uid, tut_id, value }),
          firestore
            .collection("tutorials")
            .doc(tut_id)
            .update({
              upVotes: firebase.firestore.FieldValue.increment(
                value === 1 ? 1 : 0
              ),
              downVotes: firebase.firestore.FieldValue.increment(
                value === -1 ? 1 : 0
              )
            })
        ]);
      }

      dispatch({ type: actions.ADD_TUTORIAL_LIKE_SUCCESS });
    } catch (error) {
      dispatch({
        type: actions.ADD_TUTORIAL_LIKE_FAILED,
        payload: error.message
      });
    }
  };

export const addCommentLike =
  (uid, comment_id, value) => async (firebase, firestore, dispatch) => {
    try {
      dispatch({ type: actions.ADD_COMMENT_LIKE_START });

      const existingLikeRef = await firestore
        .collection("comment_likes")
        .where("uid", "==", uid)
        .where("comment_id", "==", comment_id)
        .get();

      if (!existingLikeRef.empty) {
        const existingLike = existingLikeRef.docs[0];
        const existingLikeValue = existingLike.data().value;

        if (existingLikeValue === value) {
          dispatch({ type: actions.ADD_COMMENT_LIKE_SUCCESS });
          return;
        }

        const commentRef = firestore.collection("cl_comments").doc(comment_id);
        const commentDoc = await commentRef.get();
        const currentLikes = commentDoc.data().likes || 0;
        const currentUpVotes = commentDoc.data().upVotes || 0;
        const currentDownVotes = commentDoc.data().downVotes || 0;

        let updatedLikes = currentLikes + value - existingLikeValue;
        let updatedUpVotes = currentUpVotes;
        let updatedDownVotes = currentDownVotes;

        if (value === 1) {
          updatedUpVotes += 1;
          if (existingLikeValue === -1) {
            updatedDownVotes -= 1;
          }
        } else {
          updatedDownVotes += 1;
          if (existingLikeValue === 1) {
            updatedUpVotes -= 1;
          }
        }

        await Promise.all([
          commentRef.update({
            likes: updatedLikes,
            upVotes: updatedUpVotes,
            downVotes: updatedDownVotes
          }),
          existingLike.ref.update({ value })
        ]);
      } else {
        await Promise.all([
          firestore.collection("comment_likes").add({ uid, comment_id, value }),
          firestore
            .collection("cl_comments")
            .doc(comment_id)
            .update({
              likes: firebase.firestore.FieldValue.increment(value),
              upVotes: firebase.firestore.FieldValue.increment(
                value === 1 ? 1 : 0
              ),
              downVotes: firebase.firestore.FieldValue.increment(
                value === -1 ? 1 : 0
              )
            })
        ]);
      }

      dispatch({ type: actions.ADD_COMMENT_LIKE_SUCCESS });
    } catch (error) {
      dispatch({
        type: actions.ADD_COMMENT_LIKE_FAILED,
        payload: error.message
      });
    }
  };

export const getTutorialVote =
  (uid, tut_id) => async (firebase, firestore, dispatch) => {
    try {
      dispatch({ type: actions.GET_TUTORIAL_VOTE_START });

      const existingVoteRef = await firestore
        .collection("tutorial_likes")
        .where("uid", "==", uid)
        .where("tut_id", "==", tut_id)
        .get();

      let vote = 0;

      if (!existingVoteRef.empty) {
        vote = existingVoteRef.docs[0].data().value;
      }

      dispatch({ type: actions.GET_TUTORIAL_VOTE_SUCCESS, payload: vote });
    } catch (error) {
      dispatch({
        type: actions.GET_TUTORIAL_VOTE_FAILED,
        payload: error.message
      });
    }
  };

export const getCommentVote =
  (uid, comment_id) => async (firebase, firestore, dispatch) => {
    try {
      dispatch({ type: actions.GET_COMMENT_VOTE_START });

      const existingVoteRef = await firestore
        .collection("comment_likes")
        .where("uid", "==", uid)
        .where("comment_id", "==", comment_id)
        .get();

      let vote = 0;

      if (!existingVoteRef.empty) {
        vote = existingVoteRef.docs[0].data().value;
      }

      dispatch({ type: actions.GET_COMMENT_VOTE_SUCCESS, payload: vote });
    } catch (error) {
      dispatch({
        type: actions.GET_COMMENT_VOTE_FAILED,
        payload: error.message
      });
    }
  };
