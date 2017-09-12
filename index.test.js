const schema = `type Questionnaire {
    id: Int
    title: String
    description: String
    theme: Theme
    legalBasis: LegalBasis
    navigation: Boolean
    surveyId: String
    sections: [Section]
    groups: [Section] @deprecated(reason: "use 'sections' instead")
}

type Section {
    id: Int
    title: String!
    description: String
    pages: [Page]
    questionnaireId: Int! @deprecated(reason: "use 'questionnaire' instead")
    questionnaire: Questionnaire
}

interface Page {
    id: Int!
    title: String!
    description: String
    pageType: PageType!
    sectionId: Int! @deprecated(reason: "use 'section' instead")
    section: Section
}

type QuestionPage implements Page {
    id: Int!
    title: String!
    description: String!
    guidance: String
    pageType: PageType!
    answers:  [Answer]
    sectionId: Int! @deprecated(reason: "use 'section' instead")
    section: Section
}

interface Answer {
    id: Int!
    description: String
    guidance: String
    qCode: String
    label: String
    type: AnswerType!
    mandatory: Boolean
    questionPageId: Int! @deprecated(reason: "use 'page' instead")
    page: QuestionPage
}

type BasicAnswer implements Answer {
    id: Int!
    description: String
    guidance: String
    qCode: String
    label: String
    type: AnswerType!
    mandatory: Boolean
    questionPageId: Int! @deprecated(reason: "use 'page' instead")
    page: QuestionPage
}

type MultipleChoiceAnswer implements Answer {
    id: Int!
    description: String
    guidance: String
    qCode: String
    label: String
    type: AnswerType!
    mandatory: Boolean
    options: [Option]
    questionPageId: Int! @deprecated(reason: "use 'page' instead")
    page: QuestionPage
}

type Option {
    id: Int!
    label: String
    description: String
    value: String
    qCode: String
    childAnswerId: Int
    answerId: Int! @deprecated(reason: "use 'answer' instead")
    answer: Answer
}

enum PageType {
  QuestionPage
  InterstitialPage
}

enum AnswerType {
    Checkbox
    Currency
    Date
    MonthYearDate
    Integer
    Percentage
    PositiveInteger
    Radio
    TextArea
    TextField
    Relationship
}

enum LegalBasis {
    Voluntary
    StatisticsOfTradeAct
}

enum Theme {
    default
    census
}

type Query {
    questionnaires: [Questionnaire]
    questionnaire(id: Int!): Questionnaire
    section(id: Int!): Section
    group(id: Int!): Section @deprecated(reason: "use 'section' instead")
    page(id: Int!): Page
    questionPage(id: Int!): QuestionPage
    answer(id: Int!): Answer
    option(id: Int!): Option
}

type Mutation {
    # creates a Questionnaire along with an initial Section and Page
    createQuestionnaire(title: String!, description: String, theme: String!, legalBasis: LegalBasis!, navigation: Boolean, surveyId: String!) : Questionnaire
    updateQuestionnaire(id: Int!, title: String, description: String, theme: String, legalBasis: LegalBasis, navigation: Boolean, surveyId: String) : Questionnaire
    deleteQuestionnaire(id: Int!) : Questionnaire

    createSection(title: String!, description: String, questionnaireId: Int!) : Section
    updateSection(id: Int!, title: String, description: String) : Section
    deleteSection(id: Int!) : Section
    createGroup(title: String!, description: String, questionnaireId: Int!) : Section @deprecated(reason: "use 'createSection' instead")
    updateGroup(id: Int!, title: String, description: String) : Section @deprecated(reason: "use 'updateSection' instead")
    deleteGroup(id: Int!) : Section @deprecated(reason: "use 'deleteSection' instead")

    createPage(title: String!, description: String, sectionId: Int!) : Page
    updatePage(id: Int!, title: String!, description: String) : Page
    deletePage(id: Int!) : Page

    createQuestionPage(title: String!, description: String, guidance: String, sectionId: Int!) : QuestionPage
    updateQuestionPage(id: Int!, title: String, description: String, guidance: String) : QuestionPage
    deleteQuestionPage(id: Int!) : QuestionPage

    createAnswer(description: String, guidance: String, label: String, qCode: String, type: AnswerType!, mandatory: Boolean!, questionPageId: Int!) : Answer
    updateAnswer(id: Int!, description: String, guidance: String, label: String, qCode: String, type: AnswerType, mandatory: Boolean) : Answer
    deleteAnswer(id: Int!) : Answer
    
    createOption(label: String, description: String, value: String, qCode: String, childAnswerId: Int, answerId: Int!) : Option
    updateOption(id: Int!, label: String, description: String, value: String, qCode: String, childAnswerId: Int) : Option
    deleteOption(id: Int!) : Option
}
`;

const { merge } = require('lodash');
const { mockServer } = require('graphql-tools');

const { MockNetworkInterface } = require('./index');

describe('mock API', () => {

    it('should be possible to create a mock network interface', () => {
        const networkInterface = new MockNetworkInterface(schema);
        expect(networkInterface).toBeInstanceOf(MockNetworkInterface);
    });

    describe('no overridden behaviours', () => {

        const server = mockServer(schema);

        it('should allow default implementation of the schema', () => {
            const query = `{
                questionnaires {
                    title                
                }
            }`;

            return server.query(query).then(r => {
                const result = r.data;

                expect(result.questionnaires).toHaveLength(2);
                expect(result.questionnaires[0].title).toEqual("Hello World");
            })
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

            return server.query(query, {questionnaireId: 1}).then(r => {
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

            }).catch(e => {
                console.log(e)
            })

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

            return server.query(query, vars).then(r => {
                const result = r.data.updateQuestionnaire;

                // Because we haven't specified the mock resolver functions the
                // mock resolver will generate some default data for us.
                expect(result.title).toEqual('Hello World');
                expect([true, false]).toContain(result.navigation);
            })

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

            return server.query(query).then(result => {
                const questionnaire = result.data.questionnaires[0];
                expect(questionnaire.id).toEqual(99);
                expect(questionnaire.title).toEqual('Survey title');
                expect(questionnaire.navigation).toBe(true);
            });
        });

    });

    describe('overriding specific resolver functions', () => {

        const mocks = {
            Query: () => ({
                questionnaires: () => [{
                    id: 1,
                    title: "something",
                    navigation: false
                }]
            })
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

            return server.query(query).then(result => {
                const questionnaire = result.data.questionnaires[0];

                expect(questionnaire.id).toEqual(1);
                expect(questionnaire.title).toEqual("something");
                expect(questionnaire.navigation).toBe(false);
            });

        });

    });

    describe('accessing variables in mocks', () => {

        const mocks = {
            Mutation: () => ({
                updateQuestionnaire: (root, args, ctx) => {
                    return merge({}, args);
                }
            })
        };

        const server = mockServer(schema, mocks);

        it('should be possible to access variables in the mock resolvers', () => {

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
                id: 99,
                title: "test",
                description: "description",
                surveyId: "1",
                theme: "default",
                legalBasis: "Voluntary"
            };

            return server.query(query, vars).then(r => {
                const result = r.data.updateQuestionnaire;
                expect(result).toMatchObject(vars);
            });

        });

    });

});
