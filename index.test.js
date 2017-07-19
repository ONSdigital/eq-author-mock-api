const schema = require('eq-author-graphql-schema/schema');

const mockServer = require('./index').mockServer;

describe('mock API', () => {

    describe('no overridden behaviours', () => {

        const server = mockServer(schema);

        it('should allow default implementation of the schema', () => {
            const query = `{
                questionnaires {
                    title                
                }
            }`;

            server.query(query).then(r => {
                const result = r.data;

                expect(result.questionnaires).toHaveLength(2);
                expect(result.questionnaires[0].title).toEqual("Hello World");
            });
        });

        it('should allow default implementation for more complex queries', () => {
            const query = `
                query GetQuestionnaire($questionnaireId: Int!) {
                  questionnaire(id: $questionnaireId) {
                    id
                    title
                    description
                    theme
                    legalBasis
                    navigation
                    sections {
                      id
                      title
                      description
                      pages {
                        ... on QuestionPage {
                          id
                          title
                          description
                          guidance
                          pageType
                          type
                          mandatory
                          answers {
                            id
                            description
                            guidance
                            qCode
                            label
                            type
                            mandatory
                          }
                        }
                      }
                    }
                  }
            }`;

            server.query(query, {questionnaireId: 1}).then(r => {
                const result = r.data;
                expect(['Voluntary', 'StatisticsOfTradeAct']).toContain(result.questionnaire.legalBasis);

                // Mocking should populate nested object data
                const sections = result.questionnaire.sections;
                expect(result.questionnaire.sections).toHaveLength(2);

                const validPageTypes = [
                    'InterstitialPage',
                    'QuestionPage'
                ];

                const mockPageType = sections[0].pages[0].pageType;
                expect(validPageTypes).toContain(mockPageType);

            });

        });

        it('should allow mutations to be mocked', () => {
            const query = `
                mutation UpdateQuestionnaire(
                    $id: Int!
                    $title: String!
                    $description: String!
                    $surveyId: String!
                    $theme: String!
                    $legalBasis: LegalBasis!
                    $navigation: Boolean
                  ) {
                    updateQuestionnaire(
                      id: $id
                      title: $title
                      description: $description
                      surveyId: $surveyId
                      theme: $theme
                      legalBasis: $legalBasis
                      navigation: $navigation
                    ) {
                      id
                      title
                      description
                      surveyId
                      theme
                      legalBasis
                      navigation
                    }
                  }
            `;

            const vars = {
                id: 1,
                title: "test",
                description: "description",
                surveyId: "1",
                theme: "default",
                legalBasis: "Voluntary"
            };

            server.query(query, vars).then(r => {
                const result = r.data.updateQuestionnaire;

                // Because we haven't specified the mock resolver functions the
                // mock resolver will generate some default data for us.
                expect(result.title).toEqual('Hello World');
                expcet([true, false]).toContain(result.navigation);
            });

        });

    });

    describe('overriding the default behaviour', () => {

        const mocks = {
            Int: () => 99,
            Boolean: () => true,
            String: () => 'Survey title'
        };

        const server = mockServer(schema, mocks);

        it('should be possible to override the default built-in types', () => {
            const query = `{
                questionnaires {
                    id
                    title
                    navigation
                }
            }`;

            server.query(query).then(result => {
                const questionnaire = result.data.questionnaires[0];
                expect(questionnaire.id).toEqual(99);
                expect(questionnaire.title).toEqual('Survey title');
                expect(questionnaire.navigation).toBeTrue();
            });

        });

    });

});