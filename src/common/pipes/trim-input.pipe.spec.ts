import { TrimInputPipe } from './trim-input.pipe';

describe('TrimInputPipe', () => {
  const pipe = new TrimInputPipe();

  it('trims nested strings in request payloads', () => {
    expect(
      pipe.transform(
        {
          title: '  Fender  ',
          tags: ['  guitar ', ' stage  '],
          nested: {
            note: '  ready for pickup  '
          }
        },
        { type: 'body', metatype: Object, data: '' }
      )
    ).toEqual({
      title: 'Fender',
      tags: ['guitar', 'stage'],
      nested: {
        note: 'ready for pickup'
      }
    });
  });

  it('leaves non-request arguments unchanged', () => {
    expect(
      pipe.transform('  untouched  ', {
        type: 'custom',
        metatype: String,
        data: ''
      })
    ).toBe('  untouched  ');
  });
});
