import { BookOpen, Brain, TrendingDown, Users } from "lucide-react";

export function ScienceGuide() {
  return (
    <div className="bg-white rounded-2xl shadow-lg p-8 my-8">
      <h2 className="text-3xl font-bold text-gray-900 mb-6 flex items-center">
        <BookOpen className="w-8 h-8 mr-3 text-indigo-600" />
        The Science Behind Story Recall Testing
      </h2>

      <div className="space-y-6">
        <div className="border-l-4 border-blue-500 pl-6">
          <h3 className="text-2xl font-bold text-gray-900 mb-3 flex items-center">
            <Brain className="w-6 h-6 mr-2 text-blue-600" />
            Why Story Recall?
          </h3>
          <p className="text-lg text-gray-700 leading-relaxed mb-3">
            Story recall testing is one of the most effective methods for
            detecting early cognitive decline. The ability to encode, store, and
            retrieve narrative information engages multiple brain regions,
            including the hippocampus and temporal lobes - areas affected early
            in Alzheimer's disease.
          </p>
          <p className="text-lg text-gray-700 leading-relaxed">
            Research shows that delayed recall performance (remembering
            information after a time delay) is particularly sensitive to early
            Alzheimer's pathology, often declining years before clinical
            diagnosis.
          </p>
        </div>

        <div className="border-l-4 border-green-500 pl-6">
          <h3 className="text-2xl font-bold text-gray-900 mb-3 flex items-center">
            <TrendingDown className="w-6 h-6 mr-2 text-green-600" />
            The Importance of Memory Decay
          </h3>
          <p className="text-lg text-gray-700 leading-relaxed mb-3">
            The <strong>recall decay score</strong> - the difference between
            immediate and delayed recall - is a critical indicator. In healthy
            aging, some memory loss over time is normal. However, excessive decay
            (typically &gt;30%) suggests impaired memory consolidation, a hallmark
            of Alzheimer's disease.
          </p>
          <p className="text-lg text-gray-700 leading-relaxed">
            Our AI analyzes not just what you remember, but <em>how well</em>{" "}
            memories persist over time, providing insights into the brain's
            ability to form lasting memories.
          </p>
        </div>

        <div className="border-l-4 border-purple-500 pl-6">
          <h3 className="text-2xl font-bold text-gray-900 mb-3 flex items-center">
            <Users className="w-6 h-6 mr-2 text-purple-600" />
            Clinical Validation
          </h3>
          <p className="text-lg text-gray-700 leading-relaxed mb-3">
            Story recall tests similar to this assessment have been used in
            clinical research for decades, including:
          </p>
          <ul className="space-y-2 text-lg text-gray-700 ml-6">
            <li className="flex items-start">
              <span className="mr-2">•</span>
              <span>
                <strong>Logical Memory subtest</strong> (Wechsler Memory Scale)
              </span>
            </li>
            <li className="flex items-start">
              <span className="mr-2">•</span>
              <span>
                <strong>ADAS-Cog</strong> (Alzheimer's Disease Assessment Scale)
              </span>
            </li>
            <li className="flex items-start">
              <span className="mr-2">•</span>
              <span>
                <strong>CERAD Word List</strong> (Consortium to Establish a
                Registry for Alzheimer's Disease)
              </span>
            </li>
          </ul>
        </div>

        <div className="bg-indigo-50 border-2 border-indigo-200 rounded-xl p-6">
          <h3 className="text-xl font-bold text-indigo-900 mb-3">
            📊 What the Scores Mean
          </h3>
          <div className="space-y-3 text-indigo-800">
            <div className="flex items-start">
              <strong className="min-w-32">Key Points:</strong>
              <span>
                Measures explicit memory for specific details (names, numbers,
                objects)
              </span>
            </div>
            <div className="flex items-start">
              <strong className="min-w-32">Similarity:</strong>
              <span>
                Assesses gist memory and ability to convey the story's overall
                meaning
              </span>
            </div>
            <div className="flex items-start">
              <strong className="min-w-32">Coherence:</strong>
              <span>
                Evaluates narrative structure and linguistic organization
              </span>
            </div>
          </div>
        </div>

        <div className="bg-amber-50 border border-amber-200 rounded-lg p-6">
          <p className="text-lg text-amber-900">
            <strong>Important Note:</strong> While this assessment uses
            validated cognitive testing methods, it is designed as a screening
            tool, not a diagnostic instrument. A comprehensive medical evaluation
            is necessary for accurate diagnosis.
          </p>
        </div>
      </div>
    </div>
  );
}
