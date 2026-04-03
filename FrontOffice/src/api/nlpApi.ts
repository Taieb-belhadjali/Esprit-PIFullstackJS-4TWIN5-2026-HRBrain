import axios from "axios";
import API from "./api";

// Extract skills from a text description
export const extractSkills = (description: string) =>
  API.post("/nlp/extract-skills", { description });