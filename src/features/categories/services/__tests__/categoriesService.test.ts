import { supabase } from '../../../../lib/supabase';
import { fetchCategories } from '../categoriesService';

jest.mock('../../../../lib/supabase', () => ({
  supabase: {
    from: jest.fn(),
  },
}));

describe('fetchCategories', () => {
  it('returns categories from Supabase', async () => {
    const fromMock = supabase.from as jest.Mock;

    fromMock.mockReturnValue({
      select: jest.fn().mockReturnThis(),
      order: jest.fn().mockResolvedValue({
        data: [{id: 1, name: 'Work'}, {id: 2, name: 'Personal'}],
        error: null,
      }),
    });

    const categories = await fetchCategories();

    expect(categories).toEqual([{id: 1, name: 'Work'}, {id: 2, name: 'Personal'}]);
  });
});
