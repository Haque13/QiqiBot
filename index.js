const { Client, Util, MessageEmbed } = require("discord.js");
const YouTube = require("simple-youtube-api");
const ytdl = require("ytdl-core");
require("dotenv").config();

const bot = new Client({
    disableMentions: "all"
});

const PREFIX = "q";
const youtube = new YouTube(process.env.YTAPI_KEY);
const queue = new Map();

bot.on("ready", () => {
    console.log(`[READY] ${bot.user.tag} has been successfully booted up!`)
    bot.user.setActivity("to ghost voices!👻 | type qhelp for command list" , { type: 'LISTENING' })
  });
bot.on("warn", console.warn);
bot.on("error", console.error);
bot.on("shardDisconnect", (event, id) => console.log(`[SHARD] Shard ${id} disconnected (${event.code}) ${event}, trying to reconnect...`));
bot.on("shardReconnecting", (id) => console.log(`[SHARD] Shard ${id} reconnecting...`));
bot.on("message", async (message) => { // eslint-disable-line
    if (message.author.bot) return;
    if (!message.content.toLowerCase().startsWith(PREFIX)) return;

    const args = message.content.split(" ");
    const searchString = args.slice(1).join(" ");
    const url = args[1] ? args[1].replace(/<(.+)>/g, "$1") : "";
    const serverQueue = queue.get(message.guild.id);

    let command = message.content.toLowerCase().split(" ")[0];
    command = command.slice(PREFIX.length);

    if (command === "help" || command === "cmd") {
        const helpembed = new MessageEmbed()
            .setColor(0xa51aff)
            .setAuthor(bot.user.tag, bot.user.displayAvatarURL())
            .setDescription(`
__**Command list**__
> **\`qplay,qp [title/url]\`** > to play music
> **\`qsearch,qsc [title]\`** > to find music
> \`qskip,qs\` > to play next music
> \`qstop,quit\` > to get the bot out of the channel
> \`qpause,qps\` > to pause the music
> \`qresume,qres\` > to resume the music
> \`qnowplaying,qnp\` > to see what music is currently playing
> \`queue,qq\` > to see the music queue
> \`qloop\` > to loop the music
> \`qvolume,qvol\` > to change the music volume 
    `)
      .setFooter('music bot made by Haque#8967');
    message.channel.send(helpembed);
  }
  if (command === "play" || command === "p") {
    const voiceChannel = message.member.voice.channel;
    if (!voiceChannel)
      return message.channel.send(
        "Sorry, but you have to be in a voice channel to play a music!"
      );
    const permissions = voiceChannel.permissionsFor(message.client.user);
    if (!permissions.has("CONNECT")) {
      return message.channel.send(
        "Sorry, but I need a **`CONNECT`** permission to proceed!"
      );
    }
    if (!permissions.has("SPEAK")) {
      return message.channel.send(
        "Sorry, but I need a **`SPEAK`** permission to proceed!"
      );
    }
    if (url.match(/^https?:\/\/(www.youtube.com|youtube.com)\/playlist(.*)$/)) {
      const playlist = await youtube.getPlaylist(url);
      const videos = await playlist.getVideos();
      for (const video of Object.values(videos)) {
        const video2 = await youtube.getVideoByID(video.id); // eslint-disable-line no-await-in-loop
        await handleVideo(video2, message, voiceChannel, true); // eslint-disable-line no-await-in-loop
      }
      return message.channel.send(
        `✅  **|**  Playlist: **\`${playlist.title}\`** has been added to the queue! 😉`
      );
    } else {
      try {
        var video = await youtube.getVideo(url);
      } catch (error) {
        try {
          var videos = await youtube.searchVideos(searchString, 10);
          var video = await youtube.getVideoByID(videos[0].id);
          if (!video)
            return message.channel.send(
              "🆘  **|**  Sorry, I couldn't find anything 😢"
            );
        } catch (err) {
          console.error(err);
          return message.channel.send(
            "🆘  **|**  Sorry, I couldn't find anything 😢"
          );
        }
      }
      return handleVideo(video, message, voiceChannel);
    }
  }
  if (command === "search" || command === "sc") {
    const voiceChannel = message.member.voice.channel;
    if (!voiceChannel)
      return message.channel.send(
        "Sorry, but you have to be in a voice channel to search a music!"
      );
    const permissions = voiceChannel.permissionsFor(message.client.user);
    if (!permissions.has("CONNECT")) {
      return message.channel.send(
        "Sorry, but I need a **`CONNECT`** permission to proceed!"
      );
    }
    if (!permissions.has("SPEAK")) {
      return message.channel.send(
        "Sorry, but I need a **`SPEAK`** permission to proceed!"
      );
    }
    if (url.match(/^https?:\/\/(www.youtube.com|youtube.com)\/playlist(.*)$/)) {
      const playlist = await youtube.getPlaylist(url);
      const videos = await playlist.getVideos();
      for (const video of Object.values(videos)) {
        const video2 = await youtube.getVideoByID(video.id); // eslint-disable-line no-await-in-loop
        await handleVideo(video2, message, voiceChannel, true); // eslint-disable-line no-await-in-loop
      }
      return message.channel.send(
        `✅  **|**  Playlist: **\`${playlist.title}\`** has been added to the queue! 😉`
      );
    } else {
      try {
        var video = await youtube.getVideo(url);
      } catch (error) {
        try {
          var videos = await youtube.searchVideos(searchString, 10);
          let index = 0;
          let embedPlay = new MessageEmbed()
            .setColor(0xa51aff)
            .setAuthor("Search results", message.author.displayAvatarURL())
            .setDescription(
              `${videos
                .map(video2 => `**\`${++index}\`  |**  ${video2.title}`)
                .join("\n")}`
            )
            .setFooter(
              "Please choose one of the following 10 results, this embed will auto-deleted in 15 seconds"
            );
          // eslint-disable-next-line max-depth
          message.channel.send(embedPlay).then(m =>
            m.delete({
              timeout: 15000
            })
          );
          try {
            var response = await message.channel.awaitMessages(
              message2 => message2.content > 0 && message2.content < 11,
              {
                max: 1,
                time: 15000,
                errors: ["time"]
              }
            );
          } catch (err) {
            console.error(err);
            return message.channel.send(
              "The song selection time has expired in 15 seconds, the request has been canceled."
            );
          }
          const videoIndex = parseInt(response.first().content);
          var video = await youtube.getVideoByID(videos[videoIndex - 1].id);
        } catch (err) {
          console.error(err);
          return message.channel.send(
            "🆘  **|**  Sorry, I couldn't find anything 😢"
          );
        }
      }
      response.delete();
      return handleVideo(video, message, voiceChannel);
    }
    
  } else if (command === "skip" || command === "s") {
    if (!message.member.voice.channel)
      return message.channel.send(
        "Sorry, but you have to be in a voice channel to skip a song!"
      );
    if (!serverQueue)
      return message.channel.send("I'm not currently singing!~ 😤");
    serverQueue.connection.dispatcher.end(
      "[runCmd] Skip command has been used"
    );
    return message.channel.send(
      "⏭️  **|**  Okiee.. I'll play the next song for you!~ 😉"
    );

  } else if (command === "stop" || command === "uit") {
    if (!message.member.voice.channel)
      return message.channel.send(
        "Sorry, but you have to be in a voice channel to stop the music!"
      );
    if (!serverQueue)
      return message.channel.send("I'm not currently singing!~ 😤");
    serverQueue.songs = [];
    serverQueue.connection.dispatcher.end(
      "[runCmd] Stop command has been used"
    );
    return message.channel.send(
      "⏹️  **|**  Paipai! 👋"
    );

  } else if (command === "volume" || command === "vol") {
    if (!message.member.voice.channel)
      return message.channel.send(
        "Sorry, but you have to be in a voice channel to change the volume!"
      );
    if (!serverQueue)
      return message.channel.send("I'm not currently singing!~ 😤");
    if (!args[1])
      return message.channel.send(
        `Current volume is: **\`${serverQueue.volume}%\`**`
      );
    if (isNaN(args[1]) || args[1] > 100)
      return message.channel.send(
        "Volume can only be set between **`1`** - **`100`**"
      );
    process.env.VOLUME = args[1];
    serverQueue.connection.dispatcher.setVolume(args[1] / 100);
    return message.channel.send(`I've set the volume to: **\`${args[1]}%\`** 😉`);

  } else if (command === "nowplaying" || command === "np") {
    if (!serverQueue)
      return message.channel.send("I'm not currently singing!~ 😤");
    return message.channel.send(
      `🎶  **|**  Now Playing: **\`${serverQueue.songs[0].title}\`**`
    );

  } else if (command === "queue" || command === "q") {
    if (!serverQueue)
      return message.channel.send("I'm not currently singing!~ 😤");
    let embedQueue = new MessageEmbed()
      .setColor(0xa51aff)
      .setAuthor("Song queue", message.author.displayAvatarURL())
      .setDescription(
        `${serverQueue.songs.map(song => `**-** ${song.title}`).join("\n")}`
      )
      .setFooter(`• Now Playing: ${serverQueue.songs[0].title}`);
    return message.channel.send(embedQueue);

  } else if (command === "pause" || command === "ps") {
    if (serverQueue && serverQueue.playing) {
      serverQueue.playing = false;
      serverQueue.connection.dispatcher.pause();
      return message.channel.send("⏸  **|**  Okiee, I'll take a rest, then~ 😅");
    }
    return message.channel.send("I'm not currently singing!~ 😤");

  } else if (command === "resume" || command === "res") {
    if (serverQueue && !serverQueue.playing) {
      serverQueue.playing = true;
      serverQueue.connection.dispatcher.resume();
      return message.channel.send("▶  **|**  Resuming!.. 😉");
    }
    return message.channel.send("I'm not currently singing!~ 😤");

  } else if (command === "loop") {
    if (serverQueue) {
      serverQueue.loop = !serverQueue.loop;
      return message.channel.send(
        `🔁  **|**  Loop is **\`${
          serverQueue.loop === true ? "enabled" : "disabled"
        }\`**`
      );
    }
    return message.channel.send("I'm not currently singing!~ 😤");
  }
});

async function handleVideo(video, message, voiceChannel, playlist = false) {
  const serverQueue = queue.get(message.guild.id);
  const song = {
    id: video.id,
    title: Util.escapeMarkdown(video.title),
    url: `https://www.youtube.com/watch?v=${video.id}`
  };
  if (!serverQueue) {
    const queueConstruct = {
      textChannel: message.channel,
      voiceChannel: voiceChannel,
      connection: null,
      songs: [],
      volume: process.env.VOLUME,
      playing: true,
      loop: false
    };
    queue.set(message.guild.id, queueConstruct);
    queueConstruct.songs.push(song);

    try {
      var connection = await voiceChannel.join();
      queueConstruct.connection = connection;
      play(message.guild, queueConstruct.songs[0]);
    } catch (error) {
      console.error(
        `[ERROR] I could not join the voice channel, because: ${error}`
      );
      queue.delete(message.guild.id);
      return message.channel.send(
        `I could not join the voice channel, because: **\`${error}\`**`
      );
    }
  } else {
    serverQueue.songs.push(song);
    if (playlist) return;
    else
      return message.channel.send(
        `✅  **|**  **\`${song.title}\`** has been added to the queue! 😉`
      );
  }
  return;
}

function play(guild, song) {
  const serverQueue = queue.get(guild.id);

  if (!song) {
    serverQueue.voiceChannel.leave();
    return queue.delete(guild.id);
  }

  const dispatcher = serverQueue.connection
    .play(ytdl(song.url))
    .on("finish", () => {
      const shiffed = serverQueue.songs.shift();
      if (serverQueue.loop === true) {
        serverQueue.songs.push(shiffed);
      }
      play(guild, serverQueue.songs[0]);
    })
    .on("error", error => console.error(error));
  dispatcher.setVolume(process.env.VOLUME / 100);

  serverQueue.textChannel.send({
    embed: {
      color: 0xa51aff,
      description: `🎶  **|**  Playing: **\`${song.title}\`**`
    }
  });
}
var express = require("express");
var http = require("http");
const { type } = require("os");
var app = express();

// Ping the app
app.use(express.static("public"));
// http://expressjs.com/en/starter/basic-routing.html
app.get("/", function (request, response) {
    response.sendStatus(200);
});

// Request listener
var listener = app.listen(process.env.PORT || 8000, function () {
    console.log("Your app is listening on port " + listener.address().port);
});

bot.login(process.env.BOT_TOKEN);
