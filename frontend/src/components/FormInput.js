const FormInput = ({ label, type, name, register, error }) => {
  return (
    <div>
      <label className="block text-sm font-medium">{label}</label>
      <input type={type} {...register(name)} className="mt-1 block w-full p-2 border rounded-lg focus:ring focus:ring-blue-300" />
      {error && <p className="text-red-500 text-sm">{error.message}</p>}
    </div>
  );
};

export default FormInput;
