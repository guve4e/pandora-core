import { shouldForceEstimatorRoute } from './chat.service';

describe('customer conversation routing', () => {
  test.each(['Remont v 3 staen apartament', 'cena za tristaen apartament', 'Ремонт на тристаен апартамент', 'Remont v garsionera'])('%s starts estimation', message => {
    expect(shouldForceEstimatorRoute({ message, estimatorEnabled: true, hasDraft: false })).toBe(true);
  });
  test.each(['GOre doulu÷', 'ami priblizitelna cena', 'togava za kakvo me pita za klimatik i boiler?', 'pokaji razbivkata', 'bez su6ilnq', 'Da, 4 klimatika', 'Moje da... kakvo ozna4ava to4ka', 'Ami bu6onite? Tabloto?', 'Da', 'Imate li cenorazpis nqkude ?'])('%s continues an estimate', message => {
    expect(shouldForceEstimatorRoute({ message, estimatorEnabled: true, hasDraft: true })).toBe(true);
  });
  test.each(['hi', 'Какво е времето?', 'Как да стигна до офиса?'])('%s remains conversational', message => {
    expect(shouldForceEstimatorRoute({ message, estimatorEnabled: true, hasDraft: true })).toBe(false);
  });
  test('feature gate is respected', () => {
    expect(shouldForceEstimatorRoute({ message: 'cena za tristaen apartament', estimatorEnabled: false, hasDraft: true })).toBe(false);
  });
  test.each(['remont na selo','malka ku6ta s ve stai banq i kuhnq i koridor... iskam vsi4ko novo'])('%s routes village work to the estimator', message => {
    expect(shouldForceEstimatorRoute({message,estimatorEnabled:true,hasDraft:false})).toBe(true);
  });
  test('price follow-up uses customer history even when earlier routing missed the draft',()=>{
    expect(shouldForceEstimatorRoute({message:'A kolko 6te struva tui ne6to',estimatorEnabled:true,hasDraft:false,customerHistory:['remont na selo','malka ku6ta']})).toBe(true);
    expect(shouldForceEstimatorRoute({message:'kolko struva',estimatorEnabled:true,hasDraft:false,customerHistory:['kakvo e vremeto']})).toBe(false);
  });
  test.each(['Umno rele, tova za kakvo e','Da... oba4e trqbva li da se kurtqt stenite?'])('%s stays with the quote context', message => {
    expect(shouldForceEstimatorRoute({message,estimatorEnabled:true,hasDraft:true})).toBe(true);
  });
});
