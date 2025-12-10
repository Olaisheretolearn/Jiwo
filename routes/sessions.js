const express = require('express');
const router = express.Router();
const path = require('path');
const multer = require('multer');

const Session  = require('../models/Session');
const { requireLogin } = require('../middleware/auth');
const { broadcastToSession } = require('../wsHub');


//kinda  never actually got to use this 
const storage  = multer.diskStorage({
    destination: (req, file , cb) => {
        cb(null, path.join(__dirname, '..' , '/uploads'));
    },
    filename:(req, file, cb) => {
        const unique = Date.now() + '-' + Math.round(Math.random() * 1E9);    
        const ext = path.extname(file.originalname);
        cb(null, unique + ext);
    }
});

// this too
const fileFilter = (req, file, cb) => {
    const allowed = ['.pdf', '.txt', '.md', '.docx'];
    const ext = path.extname(file.originalname).toLowerCase();
    if(allowed.includes(ext)){
        cb(null, true);
    } else {
        cb(null,false);
    }
};

const upload = multer({ storage, fileFilter });





//routers now
router.get('/sessions/new', requireLogin, (req, res) => {
  res.render('sessions/new', {
    username: req.session.username || 'Friend'
  });
});


router.post('/sessions', requireLogin, upload.single('notesFile'), async (req, res) => {
    try{
        const{ classCode , description , bannerKey, liveTyping, interacEmail } = req.body;

        if(!classCode || !bannerKey){
            return res.status(400).send('Class code and banner key are required.');
        }

        const notesFilePath = req.file ? `uploads/${req.file.filename}` : undefined;

        const sessionDoc = await Session.create({
            hostId: req.session.userId,
            classCode,
            description,
            bannerKey,
            liveTypingEnabled: liveTyping === 'yes',
            notesFilePath,
            interacEmail,
        });

        res.redirect(`/sessions/${sessionDoc._id}`);
    } catch(err){
        console.error(err);
        res.status(500).send('Something went wrong while creating session.');
    }
}
);

//placeholder for session view route
router.get('/sessions/:id', requireLogin, async (req, res) => {
  try {
    let sessionDoc = await Session.findById(req.params.id);
    if (!sessionDoc) {
      return res.status(404).send('Session not found.');
    }
   if (sessionDoc.comments && sessionDoc.comments.length > 0) {
      sessionDoc.comments.sort(
        (a, b) => new Date(a.createdAt) - new Date(b.createdAt)
      );
    }
    const isHost = sessionDoc.hostId.toString() === req.session.userId.toString();

    
    if (!isHost) {
      const userId = req.session.userId;

      // only add if this user hasn't been counted yet
      const hasViewed = sessionDoc.viewers.some((id) =>
        id.toString() === userId.toString()
      );

      if (!hasViewed) {
        sessionDoc.viewers.push(userId);
        sessionDoc.viewerCount = sessionDoc.viewers.length;
        await sessionDoc.save();
      }
    }

    

  
   


    if (isHost) {
      return res.render('sessions/host', {
        username: req.session.username,
        session: sessionDoc,
      });
    } else {
      return res.render('sessions/viewer', {
        username: req.session.username,
        session: sessionDoc,
      });
    }
  } catch (err) {
    console.error('View session error:', err);
    res.status(500).send('Error loading session.');
  }
});




async function findLiveSessionByCode(code) {
  if (!code) return null;
  const trimmed = code.trim();
  return Session.findOne({
    classCode: new RegExp('^' + trimmed.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '$', 'i'),
    isLive: true
  });
}

// /sessions/join?code=ACS-3909
router.get('/sessions/join', requireLogin, async (req, res) => {
  try {
    const code = req.query.code;
    const sessionDoc = await findLiveSessionByCode(code);

    if (!sessionDoc) {
      return res.status(404).send('No live session found for that class code.');
    }
    return res.redirect(`/sessions/${sessionDoc._id}`);
  } catch (err) {
    console.error('Join by code error:', err);
    res.status(500).send('Error joining session.');
  }
});

// Pretty short URL for stickers: /j/ACS-3909
router.get('/j/:code', requireLogin, async (req, res) => {
  try {
    const code = req.params.code;
    const sessionDoc = await findLiveSessionByCode(code);

    if (!sessionDoc) {
      return res.status(404).send('No live session found for that class code.');
    }
    return res.redirect(`/sessions/${sessionDoc._id}`);
  } catch (err) {
    console.error('Short join URL error:', err);
    res.status(500).send('Error joining session.');
  }
});




//save notes 
// Host saves note text
router.post('/sessions/:id/note', requireLogin, async (req, res) => {
  try {
    const sessionDoc = await Session.findById(req.params.id);
    if (!sessionDoc) return res.status(404).send('Session not found');

    if (sessionDoc.hostId.toString() !== req.session.userId.toString()) {
      return res.status(403).send('Not allowed');
    }
    const { noteText } = req.body;
    sessionDoc.noteText = noteText || '';
    await sessionDoc.save();

    res.redirect(`/sessions/${sessionDoc._id}`);
  } catch (err) {
    console.error('Save note error:', err);
    res.status(500).send('Error saving notes');
  }
});


//comments
// Add a comment
router.post('/sessions/:id/comments', requireLogin, async (req, res) => {
  try {
    const sessionDoc = await Session.findById(req.params.id);
    if (!sessionDoc) return res.status(404).send('Session not found');

    const { text } = req.body;
    if (!text || !text.trim()) {
      return res.redirect(`/sessions/${sessionDoc._id}`);
    }

    sessionDoc.comments.push({
      authorName: req.session.username,
      authorId: req.session.userId,
      text: text.trim(),
    });

    await sessionDoc.save();

    const lastComment = sessionDoc.comments[sessionDoc.comments.length - 1];
    broadcastToSession(req.params.id, {
      type: 'newComment',
      comment: {
        authorName: lastComment.authorName,
        text: lastComment.text,
        createdAt: lastComment.createdAt,
      },
    });

    res.redirect(`/sessions/${sessionDoc._id}`);
  } catch (err) {
    console.error('Add comment error:', err);
    res.status(500).send('Error adding comment');
  }
});




// toggle live / not live
router.post('/sessions/:id/live', requireLogin, async (req, res) => {
  try {
    const { isLive } = req.body; // expect true/false
    await Session.findByIdAndUpdate(req.params.id, { isLive: !!isLive });
     broadcastToSession(req.params.id, {
        type: 'liveStatus',
        isLive: !!isLive,
      });

    return res.sendStatus(204);  
  } catch (err) {
    console.error('Toggle live error:', err);
    return res.status(500).send('Error updating live status.');
  }
});




//clap
// Viewer or host sends a clap
router.post('/sessions/:id/clap', requireLogin, async (req, res) => {
  try {
    const sessionDoc = await Session.findByIdAndUpdate(
      req.params.id,
      { $inc: { clapCount: 1 } },
      { new: true }
    );

    if (!sessionDoc) {
      return res.status(404).send('Session not found');
    }

    // broadcast new clap count
    broadcastToSession(req.params.id, {
      type: 'clapCount',
      clapCount: sessionDoc.clapCount,
    });

    res.redirect(`/sessions/${sessionDoc._id}`);
  } catch (err) {
    console.error('Clap error:', err);
    res.status(500).send('Error sending clap');
  }
});


router.post('/sessions/:id/end', requireLogin, async (req, res) => {
  try {
    const sessionDoc = await Session.findById(req.params.id);
    if (!sessionDoc) {
      return res.status(404).send('Session not found');
    }

    // only host can end
    if (sessionDoc.hostId.toString() !== req.session.userId.toString()) {
      return res.status(403).send('Not allowed');
    }

    sessionDoc.isLive = false;
    sessionDoc.endedAt = new Date();
    await sessionDoc.save();

    // tell everyone the session ended
    broadcastToSession(req.params.id, {
      type: 'sessionEnded',
    });

    return res.sendStatus(204); 
  } catch (err) {
    console.error('End session error:', err);
    res.status(500).send('Error ending session');
  }
});



router.get('/sessions/:id/download', requireLogin, async (req, res) => {
  try {
    const sessionDoc = await Session.findById(req.params.id);
    if (!sessionDoc) {
      return res.status(404).send('Session not found.');
    }

    const filenameSafeCode = (sessionDoc.classCode || 'notes')
      .replace(/[^a-z0-9]+/gi, '-')
      .toLowerCase();

    const content = sessionDoc.noteText || '';

    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${filenameSafeCode}.txt"`
    );
    res.setHeader('Content-Type', 'text/markdown; charset=utf-8');

    return res.send(content);
  } catch (err) {
    console.error('Download notes error:', err);
    res.status(500).send('Could not download notes.');
  }
});





module.exports = router;


