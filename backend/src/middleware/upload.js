const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Ensure upload folders exist
const uploadDir = path.join(__dirname, '..', '..', 'uploads');
const projectDir = path.join(uploadDir, 'projects');
const researchDir = path.join(uploadDir, 'research');
const avatarDir = path.join(uploadDir, 'avatars');

[uploadDir, projectDir, researchDir, avatarDir].forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

// Configure disk storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // Dynamically assign upload directory based on the fieldname or type
    if (file.fieldname === 'avatar') {
      cb(null, avatarDir);
    } else if (file.fieldname === 'researchPaper') {
      cb(null, researchDir);
    } else {
      cb(null, projectDir);
    }
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + '-' + file.originalname.replace(/\s+/g, '_'));
  }
});

// Generic file filters
const fileFilter = (req, file, cb) => {
  if (file.fieldname === 'avatar') {
    const filetypes = /jpeg|jpg|png|gif|webp/;
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = filetypes.test(file.mimetype);
    if (mimetype && extname) {
      return cb(null, true);
    }
    return cb(new Error('Only image files (jpg, png, gif, webp) are allowed for avatars!'), false);
  }

  if (file.fieldname === 'researchPaper') {
    const filetypes = /pdf|doc|docx|txt|rtf|zip/;
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    if (extname) {
      return cb(null, true);
    }
    return cb(new Error('Only documents (pdf, doc, docx, txt, zip) are allowed for research!'), false);
  }

  // Projects - allow any files but exclude executables for security
  const ext = path.extname(file.originalname).toLowerCase();
  if (ext === '.exe' || ext === '.bat' || ext === '.sh' || ext === '.js' && file.mimetype === 'application/javascript-x') {
    return cb(new Error('Executable scripts are blocked for security reasons.'), false);
  }
  cb(null, true);
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 15 * 1024 * 1024 // 15MB limit
  }
});

module.exports = upload;
