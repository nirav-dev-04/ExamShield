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

        // Shuffle each pool using the seed-derived Random
        Collections.shuffle(easyPool, random);
        Collections.shuffle(mediumPool, random);
        Collections.shuffle(hardPool, random);

        List<Question> selected = new ArrayList<>();
        List<Question> remaining = new ArrayList<>();

        // Safely pick easy questions
        int easyToPick = Math.min(easyCount, easyPool.size());
        selected.addAll(easyPool.subList(0, easyToPick));
        remaining.addAll(easyPool.subList(easyToPick, easyPool.size()));

        // Safely pick medium questions
        int mediumToPick = Math.min(mediumCount, mediumPool.size());
        selected.addAll(mediumPool.subList(0, mediumToPick));
        remaining.addAll(mediumPool.subList(mediumToPick, mediumPool.size()));

        // Safely pick hard questions
        int hardToPick = Math.min(hardCount, hardPool.size());
        selected.addAll(hardPool.subList(0, hardToPick));
        remaining.addAll(hardPool.subList(hardToPick, hardPool.size()));

        // Backfill from remaining questions if necessary to reach total count
        int totalRequired = easyCount + mediumCount + hardCount;
        if (selected.size() < totalRequired) {
            Collections.shuffle(remaining, random);
            int needed = totalRequired - selected.size();
            int toTake = Math.min(needed, remaining.size());
            selected.addAll(remaining.subList(0, toTake));
        }

        // Re-shuffle combined list to mix difficulties
        Collections.shuffle(selected, random);

        return selected;
    }
}
