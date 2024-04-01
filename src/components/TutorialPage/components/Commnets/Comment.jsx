import {
  Grid,
  Typography,
  Avatar,
  Button,
  IconButton,
  Paper
} from "@mui/material";
import { makeStyles } from "@mui/styles";
import CardActions from "@mui/material/CardActions";
import MoreVertOutlinedIcon from "@mui/icons-material/MoreVertOutlined";
import ToggleButton from "@mui/lab/ToggleButton";
import ToggleButtonGroup from "@mui/lab/ToggleButtonGroup";
import KeyboardArrowUpIcon from "@mui/icons-material/KeyboardArrowUp";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import React, {
  useState,
  useEffect,
  useCallback,
  useMemo,
  useRef
} from "react";
import Textbox from "./Textbox";
import User from "../UserDetails";
import { useDispatch, useSelector } from "react-redux";
import { useFirebase, useFirestore } from "react-redux-firebase";
import {
  getCommentData,
  getCommentReply,
  addComment,
  addCommentLike,
  getCommentVote
} from "../../../../store/actions/tutorialPageActions";
const useStyles = makeStyles(() => ({
  container: {
    margin: "10px 0",
    padding: "20px",
    overflow: "unset"
  },
  bold: {
    fontWeight: "600"
  },
  comments: {
    margin: "5px",
    padding: "10px 15px"
  },
  settings: {
    flexWrap: "wrap",
    marginTop: "-10px",
    padding: "0 5px"
  },
  small: {
    padding: "2px"
  }
}));

const Comment = ({ id, getData }) => {
  const classes = useStyles();
  const [showReplyfield, setShowReplyfield] = useState(false);
  const [alignment, setAlignment] = React.useState("left");
  const [count, setCount] = useState(1);
  const firestore = useFirestore();
  const firebase = useFirebase();
  const dispatch = useDispatch();
  const [voteStatus, setVoteStatus] = useState(0);

  const getCommentDataNew = async id => {
    await getCommentReply(id)(firebase, firestore, dispatch);
    await getCommentData(id)(firebase, firestore, dispatch);
  };

  useState(() => {
    console.log(id);
    getCommentDataNew(id);
  }, [id]);

  const commentsArray = useSelector(
    ({
      tutorialPage: {
        comment: { data }
      }
    }) => data
  );

  const [data] = commentsArray.filter(comment => comment.comment_id == id);

  const { upVotes = 0, downVotes = 0 } = data || {};

  const repliesArray = useSelector(
    ({
      tutorialPage: {
        comment: { replies }
      }
    }) => replies
  );

  const user = useSelector(
    ({
      profile: {
        user: { data }
      }
    }) => data
  );

  useEffect(() => {
    setCount(upVotes - downVotes || 0);
  }, [upVotes, downVotes]);

  const [replies] = repliesArray.filter(replies => replies.comment_id == id);

  const handleIncrement = async () => {
    setVoteStatus(1);
    await addCommentLike("codelabzuser", id, 1)(firebase, firestore, dispatch);
    await getData();
    await getCommentVote("codelabzuser", id)(firebase, firestore, dispatch);
  };

  const handleDecrement = async () => {
    setVoteStatus(-1);
    await addCommentLike("codelabzuser", id, -1)(firebase, firestore, dispatch);
    await getData();
    await getCommentVote("codelabzuser", id)(firebase, firestore, dispatch);
  };

  const handleAlignment = (event, newAlignment) => {
    setAlignment(newAlignment);
  };

  const handleSubmit = async comment => {
    const commentData = {
      content: comment,
      replyTo: data.comment_id,
      tutorial_id: data.tutorial_id,
      createdAt: firestore.FieldValue.serverTimestamp(),
      userId: "codelabzuser",
      upVotes: 0,
      downVotes: 0
    };
    console.log(commentData);
    await addComment(commentData)(firebase, firestore, dispatch);
    console.log(commentData.replyTo);
    await getCommentReply(id)(firebase, firestore, dispatch);
  };

  return (
    data && (
      <>
        <Paper variant="outlined" className={classes.comments}>
          <Typography mb={1} sx={{ fontSize: "18px" }}>
            {data?.content}
          </Typography>
          <Grid container justifyContent="space-between">
            <User id={data?.userId} timestamp={data?.createdAt} size={"sm"} />
            <CardActions className={classes.settings} disableSpacing>
              {!showReplyfield && (
                <Button
                  onClick={() => {
                    setShowReplyfield(true);
                    getCommentReply(id)(firebase, firestore, dispatch);
                  }}
                  sx={{ textTransform: "none", fontSize: "12px" }}
                >
                  {replies?.replies?.length > 0 && replies?.replies?.length}{" "}
                  Reply
                </Button>
              )}
              <ToggleButtonGroup
                size="small"
                className={classes.small}
                value={alignment}
                exclusive
                onChange={handleAlignment}
                aria-label="text alignment"
              >
                <ToggleButton
                  className={classes.small}
                  onClick={handleIncrement}
                  value="left"
                  aria-label="left aligned"
                  selected={voteStatus == 1}
                >
                  <KeyboardArrowUpIcon />
                  <span>{count}</span>
                </ToggleButton>
                <ToggleButton
                  className={classes.small}
                  onClick={handleDecrement}
                  value="center"
                  aria-label="centered"
                  selected={voteStatus == -1}
                >
                  <KeyboardArrowDownIcon />
                </ToggleButton>
              </ToggleButtonGroup>
              <IconButton aria-label="share" data-testId="MoreIcon">
                <MoreVertOutlinedIcon />
              </IconButton>
            </CardActions>
          </Grid>
        </Paper>
        {showReplyfield && (
          <div style={{ margin: "10px 0 0 10px" }}>
            <Textbox type="reply" handleSubmit={handleSubmit} />
            {replies?.replies.map((id, index) => {
              return <Comment id={id} key={index} />;
            })}
          </div>
        )}
      </>
    )
  );
};

export default Comment;
