import React from "react";
import Layout from "@theme/Layout";
import {
  TwitterTweetEmbed,
} from "react-twitter-embed";

export default function Showcases() {
  return (
    <Layout title="Hello" description="Hello React Page">
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "100%",
          fontSize: "20px",
          flexWrap: "wrap",
        }}
      >
        <TweetEmbed tweetId={"1697613919617995254"} />
        <TweetEmbed tweetId={"1700170091223031910"} />
        <TweetEmbed tweetId={"1695022580120346964"} />
        <TweetEmbed tweetId={"1690023371298230272"} />
        <TweetEmbed tweetId={"1691813194644246561"} />
      </div>
    </Layout>
  );
}


function TweetEmbed({ tweetId }: { tweetId: string}) {
  return (
    <div className="tweetEmbed">
      <TwitterTweetEmbed tweetId={tweetId} />
    </div>
  );
}