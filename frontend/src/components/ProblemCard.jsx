function ProblemCard({ title, difficulty, category }) {
  return (
    <div>
     <h3>{title}</h3>
     <p>Difficulty: {difficulty}</p>
      <p>Category: {category}</p>
    </div>
  );
}

export default ProblemCard;