import axios, { AxiosResponse } from "axios";

const API_URL = 'https://localhost:3009';

export default {
  API_URL,
  commonGetRequest,
  commonPostRequest
}


export function submitFeedBack(feedBackData) { return commonPostRequest('/feedback', feedBackData) }
export function getUpdate(version) { return commonGetRequest('/update?version=' + version) }



function commonGetRequest(url) : Promise<AxiosResponse<any>> {
  return new Promise<AxiosResponse<any>>((resolve, reject) => {
    axios.get(API_URL + url).then((value) => {
      if(value.data.code == 200) resolve(value);
      else reject(value.data.message)
    }).catch((e) => reject(e))
  });
}
function commonPostRequest(url, data) : Promise<AxiosResponse<any>> {
  return new Promise<AxiosResponse<any>>((resolve, reject) => {
    axios.post(API_URL + url, data).then((value) => {
      if(value.data.code == 200) resolve(value);
      else reject(value.data.message)
    }).catch((e) => reject(e))
  });
}