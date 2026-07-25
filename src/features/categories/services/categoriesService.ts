import { supabase } from '../../../lib/supabase';

export type Category = {
  id: number;
  name: string;
};

export const fetchCategories = async (): Promise<Category[]> => {
  const {data, error} = await supabase
    .from('categories')
    .select('id, name')
    .order('name', {ascending: true});

  if (error) {
    throw error;
  }

  return (data ?? []) as Category[];
};
