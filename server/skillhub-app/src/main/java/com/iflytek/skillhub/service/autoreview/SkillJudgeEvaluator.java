package com.iflytek.skillhub.service.autoreview;

public interface SkillJudgeEvaluator {
    SkillJudgeEvaluationResult evaluate(SkillPackageSnapshot snapshot);
}
