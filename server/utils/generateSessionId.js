// Generates a short, human-friendly session code such as "AB3K9Q".
// Avoids visually ambiguous characters (0/O, 1/I) so codes are easy to read
// aloud or type on a projector.
const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

function generateSessionId(length = 6) {
  let code = "";
  for (let i = 0; i < length; i++) {
    code += ALPHABET[Math.floor(Math.random() * ALPHABET.length)];
  }
  return code;
}

module.exports = generateSessionId;
