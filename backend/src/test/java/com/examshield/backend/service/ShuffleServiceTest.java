package com.examshield.backend.service;

import com.examshield.backend.model.Difficulty;
import com.examshield.backend.model.Question;
import com.examshield.backend.model.QuestionType;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import java.util.ArrayList;
import java.util.List;
import static org.junit.jupiter.api.Assertions.*;

public class ShuffleServiceTest {

    private ShuffleService shuffleService;
    private List<Question> pool;

    @BeforeEach
    public void setUp() {
        shuffleService = new ShuffleService();
        pool = new ArrayList<>();

        // Seed 10 Easy, 10 Medium, 10 Hard questions
        for (long i = 1; i <= 10; i++) {
            pool.add(createDummyQuestion(i, Difficulty.EASY));
            pool.add(createDummyQuestion(10 + i, Difficulty.MEDIUM));
            pool.add(createDummyQuestion(20 + i, Difficulty.HARD));
        }
    }

    private Question createDummyQuestion(Long id, Difficulty difficulty) {
        Question q = new Question();
        q.setId(id);
        q.setDifficulty(difficulty);
        q.setType(QuestionType.MCQ);
        q.setQuestionText("Question " + id);
        return q;
    }

    @Test
    public void testSameSeedProducesIdenticalSequence() {
        String seed = "student1_exam1";
        
        List<Question> result1 = shuffleService.shuffleQuestions(pool, seed, 3, 3, 3);
        List<Question> result2 = shuffleService.shuffleQuestions(pool, seed, 3, 3, 3);

        assertEquals(result1.size(), result2.size());
        for (int i = 0; i < result1.size(); i++) {
            assertEquals(result1.get(i).getId(), result2.get(i).getId());
        }
    }

    @Test
    public void testDifferentSeedsProduceDifferentSequences() {
        String seed1 = "student1_exam1";
        String seed2 = "student2_exam1";

        List<Question> result1 = shuffleService.shuffleQuestions(pool, seed1, 5, 5, 5);
        List<Question> result2 = shuffleService.shuffleQuestions(pool, seed2, 5, 5, 5);

        assertEquals(result1.size(), result2.size());
        
        boolean isDifferent = false;
        for (int i = 0; i < result1.size(); i++) {
            if (!result1.get(i).getId().equals(result2.get(i).getId())) {
                isDifferent = true;
                break;
            }
        }
        assertTrue(isDifferent, "Different seeds should produce different question orders or sets");
    }

    @Test
    public void testCorrectDifficultyDistributionHonored() {
        String seed = "student1_exam1";
        int easyReq = 4;
        int medReq = 3;
        int hardReq = 2;

        List<Question> result = shuffleService.shuffleQuestions(pool, seed, easyReq, medReq, hardReq);

        assertEquals(easyReq + medReq + hardReq, result.size());

        long easyCount = result.stream().filter(q -> q.getDifficulty() == Difficulty.EASY).count();
        long medCount = result.stream().filter(q -> q.getDifficulty() == Difficulty.MEDIUM).count();
        long hardCount = result.stream().filter(q -> q.getDifficulty() == Difficulty.HARD).count();

        assertEquals(easyReq, easyCount);
        assertEquals(medReq, medCount);
        assertEquals(hardReq, hardCount);
    }

    @Test
    public void testThrowsExceptionWhenPoolIsInsufficient() {
        String seed = "student1_exam1";
        
        // Try to request 15 EASY questions when pool only has 10
        assertThrows(IllegalArgumentException.class, () -> {
            shuffleService.shuffleQuestions(pool, seed, 15, 2, 2);
        });

        // Try to request 11 HARD questions when pool only has 10
        assertThrows(IllegalArgumentException.class, () -> {
            shuffleService.shuffleQuestions(pool, seed, 2, 2, 11);
        });
    }
}
