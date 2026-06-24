import supabaseClient from "@/config/supabase";

export const getContents = async () => {
  const { data, error } = await supabaseClient.from("Contents").select("*");
  if (error) {
    throw new Error("Error getting all contents");
  }

  return data;
};
