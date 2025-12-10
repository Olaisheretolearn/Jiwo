const mongoose  = require('mongoose');
const bcrypt = require('bcrypt');

const userSchema = new mongoose.Schema(
    {
    username:{
        type:String,
        required:true,
        unique:true,
        trim:true,
        minlength:3,
        maxlength:30
    }, 
    email:{
        type:String,
        required:true,
        unique:true,
        trim:true,
    },
    passwordHash:{
        type:String,
        required:true,
    },
    interacEmail:{
        type:Boolean,
        trim:true,
    },
},
{    timestamps:true}
);

// check passwords
userSchema.methods.checkPassword = async function (plainPassword) {
  
  if (!plainPassword || !this.passwordHash) {
    return false;
  }

  return bcrypt.compare(plainPassword, this.passwordHash);
};


//create a user with hashing
userSchema.statics.signup = async function ({ username, email, password, interacEmail }) {
  const saltRounds = 10;
  const passwordHash = await bcrypt.hash(password, saltRounds);

  const user = new this({
    username,
    email,
    passwordHash,
    interacEmail,
  });

  return user.save();
};

module.exports = mongoose.model('User', userSchema);