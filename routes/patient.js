// routes/patient.js
const express = require('express');
const router = express.Router();
const db = require('../db'); // shared pool

// POST /login
router.post('/login', function(req, res){
  const userId = req.body.username;
  const password = req.body.password;

  if (!userId || !password) {
    req.flash('error', 'Please provide User ID and password');
    return res.redirect('/patients');
  }

  // Check log mapping first (non-blocking retrieval of doctor)
  db.query('SELECT * FROM logs WHERE patId = ?', [userId], function(err, logs){
    if (err) {
      console.error('Error fetching logs:', err);
      // continue without doctor
      logs = [];
    }

    // Now check patient credentials
    db.query('SELECT * FROM pdata WHERE userId = ?', [userId], function(err2, patients){
      if (err2) {
        console.error('SOMETHING WENT WRONG!!', err2);
        req.flash('error', 'Server error');
        return res.redirect('/patients');
      }

      if (!Array.isArray(patients) || patients.length === 0) {
        console.log("USER doesn't exist in system!!");
        req.flash('error', 'Invalid credentials');
        return res.redirect('/patients');
      }

      const patient = patients[0];
      if (patient.password !== password) {
        console.log('Invalid password');
        req.flash('error', 'Invalid credentials');
        return res.redirect('/patients');
      }

      // find doctor data if linked
      if (Array.isArray(logs) && logs.length > 0) {
        db.query('SELECT * FROM ddata WHERE userId = ?', [logs[0].docId], function(err3, docs){
          const doc = (!err3 && Array.isArray(docs) && docs.length > 0) ? docs[0] : null;
          return res.render('patient', { data: patient, doc: doc });
        });
      } else {
        return res.render('patient', { data: patient, doc: null });
      }
    });
  });
});

// POST /register
router.post('/register', function(req, res){
  const x = req.body;
  if (!x || !x.first || !x.last || !x.aadhar || !x.password) {
    req.flash('error', 'Please fill required fields');
    return res.redirect('/patients');
  }

  const insertSql = 'INSERT INTO pdata (first, last, sex, blood, aadhar, password) VALUES (?, ?, ?, ?, ?, ?)';
  const params = [x.first, x.last, x.sex || null, x.blood || null, x.aadhar, x.password];

  db.query(insertSql, params, function(err, result){
    if (err) {
      console.error('Error inserting patient:', err);
      req.flash('error', 'Could not register (maybe duplicate aadhar).');
      return res.redirect('/patients');
    }

    // fetch inserted patient by aadhar
    db.query('SELECT * FROM pdata WHERE aadhar = ?', [x.aadhar], function(err2, patResult){
      if (err2 || !Array.isArray(patResult) || patResult.length === 0) {
        console.error('Inserted patient not found:', err2);
        req.flash('error', 'Registration succeeded but could not fetch user.');
        return res.redirect('/patients');
      }

      const pat = patResult[0];

      // find a doctor with minimal patients
      db.query('SELECT * FROM ddata WHERE patients = (SELECT MIN(patients) FROM ddata)', function(err3, docResult){
        if (err3) {
          console.error('Error finding doctor:', err3);
          return res.render('patient', { data: pat, doc: null });
        }

        if (!Array.isArray(docResult) || docResult.length === 0) {
          // no doctors available
          return res.render('patient', { data: pat, doc: null });
        }

        const doc1 = docResult[0];

        // increment doctor's patients and insert into logs
        db.query('UPDATE ddata SET patients = patients + 1 WHERE userId = ?', [doc1.userId], function(err4){
          if (err4) console.error('Error updating doctor patient count:', err4);

          db.query('INSERT INTO logs (docId, patId) VALUES (?, ?)', [doc1.userId, pat.userId], function(err5){
            if (err5) console.error('Error inserting log:', err5);
            return res.render('patient', { data: pat, doc: doc1 });
          });
        });
      });
    });
  });
});

// GET /logout (redirect)
router.get('/logout', function(req, res){
  res.redirect('/patients');
});

// POST /manage
router.post('/manage', function(req, res){
  const x = req.body;
  const userId = x.userId;
  if (!userId) return res.redirect('/patients');

  const updates = [];
  if (x.add) updates.push({ sql: 'UPDATE pdata SET address = ? WHERE userId = ?', params: [x.add, userId] });
  if (x.ill) updates.push({ sql: 'UPDATE pdata SET ill = ? WHERE userId = ?', params: [x.ill, userId] });
  if (x.allergy) updates.push({ sql: 'UPDATE pdata SET allergy = ? WHERE userId = ?', params: [x.allergy, userId] });
  if (x.phone) updates.push({ sql: 'UPDATE pdata SET phone = ? WHERE userId = ?', params: [x.phone, userId] });

  // run sequentially
  (function run(i){
    if (i >= updates.length) {
      // fetch mapping & patient and render
      db.query('SELECT * FROM logs WHERE patId = ?', [userId], function(err, logs){
        if (err) { console.error('Error fetching logs:', err); logs = []; }
        if (Array.isArray(logs) && logs.length > 0) {
          db.query('SELECT * FROM ddata WHERE userId = ?', [logs[0].docId], function(err2, ddataRes){
            const doc = (!err2 && Array.isArray(ddataRes) && ddataRes.length > 0) ? ddataRes[0] : null;
            db.query('SELECT * FROM pdata WHERE userId = ?', [userId], function(err3, pRes){
              return res.render('patient', { data: (pRes && pRes[0]) ? pRes[0] : null, doc: doc });
            });
          });
        } else {
          db.query('SELECT * FROM pdata WHERE userId = ?', [userId], function(err3, pRes){
            return res.render('patient', { data: (pRes && pRes[0]) ? pRes[0] : null, doc: null });
          });
        }
      });
      return;
    }

    const u = updates[i];
    db.query(u.sql, u.params, function(errU){
      if (errU) console.error('Manage update error:', errU);
      run(i + 1);
    });
  })(0);
});

// POST /delete (delete patient and logs)
router.post('/delete', function(req, res){
  const userId = req.body.userId;
  if (!userId) return res.redirect('/patients');

  db.query('DELETE FROM logs WHERE patId = ?', [userId], function(err){
    if (err) console.error('Error deleting logs:', err);
    db.query('DELETE FROM pdata WHERE userId = ?', [userId], function(err2){
      if (err2) console.error('Error deleting patient:', err2);
      res.redirect('/patients');
    });
  });
});

module.exports = router;
