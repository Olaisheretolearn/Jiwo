const mongoose  = require('mongoose');

const sessionSchema = new mongoose.Schema(
    {
        hostId:{
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required:true,
        },

        classCode:{
            type:String,
            required:true,
            trim:true,
        },

        description:{
            type:String,
            trim:true,
        },

        bannerKey:{
            type:String,
            trim:true,
        },

        liveTypingEnabled:{
            type:Boolean,
            default:true,
        },

        notesFilePath:{
            type:String,

        },

        interacEmail:{
            type:String,
            trim:true,
        },

        isLive:{
            type:Boolean,
            default:true,
        },

        startedAt:{
            type:Date,
            default:Date.now,
        },

        endedAt:{
            type:Date,
        },

        viewerCount: {
        type: Number,
        default: 0,
    },
        clapCount: {
        type: Number,
        default: 0,
    },

     noteText: {
      type: String,
      default: '',
    },

    viewerCount: {
    type: Number,
    default: 0,
  },
  viewers: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    }
  ],

    comments: [
  {
    authorName: String,
    authorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    text: String,
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
],

},
{    timestamps:true}
);
module.exports = mongoose.model('Session', sessionSchema);