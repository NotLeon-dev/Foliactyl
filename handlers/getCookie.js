export default function getCookie(req, cname) {
    const cookies = req.headers.cookie;
    if (!cookies) return null;
    
    const name = cname + "=";
    const ca = cookies.split(';');
    
    for (let i = 0; i < ca.length; i++) {
        let c = ca[i].trim();
        if (c.indexOf(name) === 0) {
            return decodeURIComponent(c.substring(name.length));
        }
    }
    
    return "";
}