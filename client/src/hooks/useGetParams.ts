const useGetParams = () => {
  const url = window.location.href;
  const params = url.split('?')[1] + "#";
  const paramsFiltered = params.substring(0, params.indexOf('#'));
  console.log(paramsFiltered);
  return new URLSearchParams(paramsFiltered);
} 

export default useGetParams;