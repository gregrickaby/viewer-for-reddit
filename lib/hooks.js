import { useEffect, useState } from "react";

export function useFetch(endpoint) {
  const [isLoading, setIsLoading] = useState(true);
  const [data, setData] = useState({});

  // Fetch data, then setData state.
  useEffect(() => {
    async function fetchData() {
      const response = await fetch(endpoint);
      const data = await response.json();
      setData(data);
      setIsLoading(false);
    }
    fetchData();
  }, [endpoint]);

  return [isLoading, data];
}

export function useForm(initialValues) {
  // State doesn't have to be an object. It can be whatever you want... string, int, array,
  // Initial state (values), and a function (setValues) to override initial state.
  // useState always returns an array of values, which is destructured using [] to the left.
  const [values, setValues] = useState(initialValues);

  return [
    values,
    (e) => {
      setValues({
        ...values,
        [e.target.name]: e.target.value,
      });
    },
  ];
}
