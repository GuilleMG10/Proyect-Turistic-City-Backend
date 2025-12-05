import { describe, expect, it } from "vitest";
import { build_profile_prompt } from "../prompts/index.js";

describe("vision prompts", () => {
	describe("build_profile_prompt", () => {
		it("should return base prompt without context", () => {
			const prompt = build_profile_prompt();
			expect(prompt).toContain("evaluador estricto");
			expect(prompt).toContain("foto de perfil");
			expect(prompt).not.toContain("Contexto adicional");
		});

		it("should append context when provided", () => {
			const prompt = build_profile_prompt("Usuario profesional");
			expect(prompt).toContain("evaluador estricto");
			expect(prompt).toContain(
				"Contexto adicional del usuario: Usuario profesional",
			);
		});
	});
});
