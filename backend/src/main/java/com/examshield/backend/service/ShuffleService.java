package com.examshield.backend.service;

import com.examshield.backend.model.Difficulty;
import com.examshield.backend.model.Question;
import org.springframework.stereotype.Service;
import java.nio.ByteBuffer;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Random;
import java.util.stream.Collectors;

@Service
public class ShuffleService {

    private Random getRandomFromSeed(String seed) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(seed.getBytes(StandardCharsets.UTF_8));
            long seedLong = ByteBuffer.wrap(hash).getLong();
            return new Random(seedLong);
        } catch (NoSuchAlgorithmException e) {
            return new Random(seed.hashCode());
        }
    }

    /**
     * Shuffles a pool of questions deterministically based on a seed.
     * Respects difficulty count requirements: easyCount, mediumCount, hardCount.
     */
    public List<Question> shuffleQuestions(List<Question> pool, String seed, int easyCount, int mediumCount, int hardCount) {
        Random random = getRandomFromSeed(seed);

        // Group pool by difficulty
        List<Question> easyPool = pool.stream()
                .filter(q -> q.getDifficulty() == Difficulty.EASY)
                .collect(Collectors.toList());

        List<Question> mediumPool = pool.stream()
                .filter(q -> q.getDifficulty() == Difficulty.MEDIUM)
                .collect(Collectors.toList());

        List<Question> hardPool = pool.stream()
                .filter(q -> q.getDifficulty() == Difficulty.HARD)
                .collect(Collectors.toList());

        // Validate that pool has enough questions
        if (easyPool.size() < easyCount) {
            throw new IllegalArgumentException("Not enough EASY questions in the pool. Required: " + easyCount + ", Available: " + easyPool.size());
        }
        if (mediumPool.size() < mediumCount) {
            throw new IllegalArgumentException("Not enough MEDIUM questions in the pool. Required: " + mediumCount + ", Available: " + mediumPool.size());
        }
        if (hardPool.size() < hardCount) {
            throw new IllegalArgumentException("Not enough HARD questions in the pool. Required: " + hardCount + ", Available: " + hardPool.size());
        }

        // Shuffle each pool using the seed-derived Random
        Collections.shuffle(easyPool, random);
        Collections.shuffle(mediumPool, random);
        Collections.shuffle(hardPool, random);

        // Pick required counts
        List<Question> selected = new ArrayList<>();
        selected.addAll(easyPool.subList(0, easyCount));
        selected.addAll(mediumPool.subList(0, mediumCount));
        selected.addAll(hardPool.subList(0, hardCount));

        // Re-shuffle the combined list to mix difficulties
        Collections.shuffle(selected, random);

        return selected;
    }
}
