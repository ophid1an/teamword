const multer = require('multer'),
    storage = multer.memoryStorage(),
    upload = multer({
        storage: storage
    }).single('file-to-upload'),

    Crossword = require('../models/crossword'),
    parseCrossword = require('../lib/util').parseCrossword;



exports.crosswordUploadGet = (req, res) => {
    if (req.user.isAdmin) {
        return res.render('upload-crossword');
    }
    res.redirect('/main');
};




exports.crosswordUploadPost = (req, res, next) => {

    if (req.user.isAdmin) {
        upload(req, res, (err) => {
            if (err) {
                return next(err);
            }

            var crosswordToParse;
            try {
                crosswordToParse = JSON.parse(req.file.buffer.toString());
            } catch (err) {
                return res.render('upload-crossword', {
                    errors: [err]
                });
            }

            const cwData = parseCrossword(crosswordToParse);

            if (cwData && cwData.cw && cwData.matrix) {
                var filename = req.file.originalname;

                if (typeof filename === 'string') {
                    cwData.cw.filename = filename;
                }

                // Insert crossword to database
                new Crossword(cwData.cw).save(err => {
                    if (err) {
                        return next(err);
                    }

                    cwData.matrix = cwData.matrix.split('\n');

                    // Construct definitions

                    var defs = {};
                    defs.across = [];
                    defs.down = [];

                    cwData.cw.cluesAcrossInd.forEach((eleOuter) => {
                        var str = '';
                        var lenOuter = eleOuter.length;
                        eleOuter.forEach((eleInner, indInner) => {
                            str += cwData.cw.clues[eleInner].def;
                            str += indInner === lenOuter - 1 ? '' : ' - ';
                        });
                        defs.across.push(str);
                    });

                    cwData.cw.cluesDownInd.forEach((eleOuter) => {
                        var str = '';
                        var lenOuter = eleOuter.length;
                        eleOuter.forEach((eleInner, indInner) => {
                            str += cwData.cw.clues[eleInner].def;
                            str += indInner === lenOuter - 1 ? '' : ' - ';
                        });
                        defs.down.push(str);
                    });

                    // Render

                    return res.render('upload-crossword', {
                        success: res.__('crosswordUploadSuccess'),
                        matrix: cwData.matrix,
                        defs: defs
                    });
                });

            } else {
                var errors = [res.__('crosswordParsingFailure')];

                if (cwData.error) {
                    errors.push(cwData.error);
                }

                return res.render('upload-crossword', {
                    errors
                });
            }



        });

    } else {
        res.redirect('/main');
    }
};
