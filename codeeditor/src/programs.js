import axios from "axios";
export const getLanguages = async () => {
const apiCall = await axios.create({
    baseURL : "https://emkc.org/api/v2/piston",
    timeout : 6000,
    headers : {
        'Content-Type' : "application/json"
    }
});
var LANGUAGES = {}
await apiCall.get('/runtimes').then((response) => {
    response.data.map((language) => {
        LANGUAGES[language.language] = language.version
    });
}).catch((err) => {
    console.log(err);
});
return LANGUAGES;
};

