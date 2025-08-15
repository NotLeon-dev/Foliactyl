export default function btoa(str) {
    if (str === undefined) return;
    let buffer;
  
    if (str instanceof Buffer) {
        buffer = str;
    } else {
        buffer = Buffer.from(str.toString(), "binary");
    }
    return buffer.toString("base64");
}

