import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { registerCompany } from "../../services/api";
import logo from '../../assets/hrms_logo.png';

import { Country, State, City } from "country-state-city";
import { toast } from "react-toastify";

const Register = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1);

  const [countriesList, setCountriesList] = useState([]);
  const [statesList, setStatesList] = useState([]);
  const [citiesList, setCitiesList] = useState([]);

  const [formData, setFormData] = useState({
    companyName: "",
    companyEmail: "",
    phone: "",
    industry: "",
    companySize: "",
    country: "",
    countryName: "",
    state: "",
    stateName: "",
    city: "",
    address: "",
    adminName: "",
    adminEmail: "",
    password: "",
    confirmPassword: "",
  });

  useEffect(() => {
    setCountriesList(Country.getAllCountries());
  }, []);


  useEffect(() => {
    if (formData.country) {
      const states = State.getStatesOfCountry(formData.country);
      setStatesList(states);
      setCitiesList([]);
      setFormData((prev) => ({ ...prev, state: "", stateName: "", city: "" }));
    }
  }, [formData.country]);

  useEffect(() => {
    if (formData.country && formData.state) {
      const cities = City.getCitiesOfState(formData.country, formData.state);
      setCitiesList(cities);
      setFormData((prev) => ({ ...prev, city: "" }));
    }
  }, [formData.state, formData.country]);

  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name === "country") {
      const selectedCountry = countriesList.find((c) => c.isoCode === value);
      setFormData((prev) => ({
        ...prev,
        country: value,
        countryName: selectedCountry ? selectedCountry.name : "",
      }));
    } else if (name === "state") {
      const selectedState = statesList.find((s) => s.isoCode === value);
      setFormData((prev) => ({
        ...prev,
        state: value,
        stateName: selectedState ? selectedState.name : "",
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  const handleNextStep = (e) => {
    e.preventDefault();
    setStep(2);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    

    if (formData.password !== formData.confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    try {
      setLoading(true);
      await registerCompany({
        companyName: formData.companyName,
        companyEmail: formData.companyEmail,
        phone: formData.phone,
        industry: formData.industry,
        companySize: formData.companySize,
        country: formData.countryName,
        state: formData.stateName,
        city: formData.city,
        address: formData.address,
        adminName: formData.adminName,
        adminEmail: formData.adminEmail,
        password: formData.password,
      });

      toast.success('regisetr Successfully!');
      navigate("/login");
    } catch (error) {

      toast.error(error.response.data.message || "Invalid Credentials");

    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-screen w-screen bg-gray-50 flex items-center justify-center p-4 font-sans overflow-hidden">
      <div className="max-w-3xl w-full p-6 bg-white border border-gray-200 rounded-3xl shadow-lg flex flex-col max-h-[95vh] overflow-y-auto">


        <div className="flex flex-col items-center text-center w-full max-w-lg mx-auto mb-4 flex-shrink-0">
          <img src={logo} alt="hrms logo" className="h-14 w-auto object-contain mb-1" />
          <h2 className="text-2xl font-extrabold text-black lowercase">
            {step === 1 ? "register your company" : "create admin account"}
          </h2>
          <p className="text-xs text-gray-500 mt-0.5 lowercase">
            step {step} of 2 — {step === 1 ? "company profile" : "credentials"}
          </p>
        </div>


        <form className="w-full flex-1 flex flex-col justify-between" onSubmit={step === 1 ? handleNextStep : handleSubmit}>
          <div className="space-y-4">
            {step === 1 && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-3 w-full">

                  {/* Company Name */}
                  <div className="flex flex-col">
                    <label className="block text-xs font-semibold text-gray-900 mb-1 lowercase">company name</label>
                    <input type="text" name="companyName" required value={formData.companyName} onChange={handleChange} className="appearance-none block w-full px-3 py-2 border border-gray-200 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-200 text-xs text-gray-700" placeholder="cygnux corp" />
                  </div>

                  {/* Company Email */}
                  <div className="flex flex-col">
                    <label className="block text-xs font-semibold text-gray-900 mb-1 lowercase">company email</label>
                    <input type="email" name="companyEmail" required value={formData.companyEmail} onChange={handleChange} className="appearance-none block w-full px-3 py-2 border border-gray-200 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-200 text-xs text-gray-700" placeholder="info@company.com" />
                  </div>

                  {/* Phone Number */}
                  <div className="flex flex-col">
                    <label className="block text-xs font-semibold text-gray-900 mb-1 lowercase">phone number</label>
                    <input type="tel" name="phone" maxLength={10} required value={formData.phone} onChange={handleChange} className="appearance-none block w-full px-3 py-2 border border-gray-200 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-200 text-xs text-gray-700" placeholder="+91 98765 43210" />
                  </div>

                  {/* Industry */}
                  <div className="flex flex-col">
                    <label className="block text-xs font-semibold text-gray-900 mb-1 lowercase">industry</label>
                    <select name="industry" required value={formData.industry} onChange={handleChange} className="block w-full px-3 py-2 border border-gray-200 rounded-xl text-xs bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-200 lowercase">
                      <option value="" disabled>select industry</option>
                      <option value="it">information technology</option>
                      <option value="finance">finance</option>
                      <option value="manufacturing">manufacturing</option>
                      <option value="healthcare">healthcare</option>
                    </select>
                  </div>

                  {/* Company Size */}
                  <div className="flex flex-col">
                    <label className="block text-xs font-semibold text-gray-900 mb-1 lowercase">company size</label>
                    <select name="companySize" required value={formData.companySize} onChange={handleChange} className="block w-full px-3 py-2 border border-gray-200 rounded-xl text-xs bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-200 lowercase">
                      <option value="" disabled>select size</option>
                      <option value="1-10">1-10 employees</option>
                      <option value="11-50">11-50 employees</option>
                      <option value="51-200">51-200 employees</option>
                      <option value="201+">201+ employees</option>
                    </select>
                  </div>

                  {/* COUNTRY DROPDOWN */}
                  <div className="flex flex-col">
                    <label className="block text-xs font-semibold text-gray-900 mb-1 lowercase">country</label>
                    <select name="country" required value={formData.country} onChange={handleChange} className="block w-full px-3 py-2 border border-gray-200 rounded-xl text-xs bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-200">
                      <option value="" disabled>select country</option>
                      {countriesList.map((country) => (
                        <option key={country.isoCode} value={country.isoCode}>  
                          {country.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* STATE DROPDOWN */}
                  <div className="flex flex-col">
                    <label className="block text-xs font-semibold text-gray-900 mb-1 lowercase">state</label>
                    <select name="state" required value={formData.state} onChange={handleChange} disabled={!formData.country} className="block w-full px-3 py-2 border border-gray-200 rounded-xl text-xs bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-200 disabled:bg-gray-100">
                      <option value="">select state</option>
                      {statesList.map((state) => (
                        <option key={state.isoCode} value={state.isoCode}>
                          {state.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* CITY DROPDOWN */}
                  <div className="flex flex-col">
                    <label className="block text-xs font-semibold text-gray-900 mb-1 lowercase">city</label>
                    <select name="city" required value={formData.city} onChange={handleChange} disabled={!formData.state} className="block w-full px-3 py-2 border border-gray-200 rounded-xl text-xs bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-200 disabled:bg-gray-100">
                      <option value="">select city</option>
                      {citiesList.map((city, index) => (
                        <option key={index} value={city.name}>
                          {city.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Address */}
                <div className="w-full">
                  <label className="block text-xs font-semibold text-gray-900 mb-1 lowercase">address</label>
                  <textarea name="address" required rows="2" value={formData.address} onChange={handleChange} className="appearance-none block w-full px-3 py-2 border border-gray-200 rounded-xl shadow-sm text-xs text-gray-700 resize-none focus:outline-none focus:ring-2 focus:ring-blue-200" placeholder="enter complete office address..."></textarea>
                </div>

                <div className="w-full pt-2 flex justify-end">
                  <button type="submit" className="px-6 py-2.5 rounded-full text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 transition lowercase">
                    continue to admin setup
                  </button>
                </div>
              </div>
            )}

            {/* STEP 2: Admin Account */}
            {step === 2 && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-3 w-full">
                  <div className="flex flex-col">
                    <label className="block text-xs font-semibold text-gray-900 mb-1 lowercase">admin full name</label>
                    <input type="text" name="adminName" required value={formData.adminName} onChange={handleChange} className="appearance-none block w-full px-3 py-2 border border-gray-200 rounded-xl text-xs text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-200" placeholder="john doe" />
                  </div>
                  <div className="flex flex-col">
                    <label className="block text-xs font-semibold text-gray-900 mb-1 lowercase">admin personal email</label>
                    <input type="email" name="adminEmail" required value={formData.adminEmail} onChange={handleChange} className="appearance-none block w-full px-3 py-2 border border-gray-200 rounded-xl text-xs text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-200" placeholder="john.doe@example.com" />
                  </div>
                  <div className="flex flex-col">
                    <label className="block text-xs font-semibold text-gray-900 mb-1 lowercase">password</label>
                    <input type="password" name="password" required value={formData.password} onChange={handleChange} className="appearance-none block w-full px-3 py-2 border border-gray-200 rounded-xl text-xs text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-200" placeholder="••••••••" />
                  </div>
                  <div className="flex flex-col">
                    <label className="block text-xs font-semibold text-gray-900 mb-1 lowercase">confirm password</label>
                    <input type="password" name="confirmPassword" required value={formData.confirmPassword} onChange={handleChange} className="appearance-none block w-full px-3 py-2 border border-gray-200 rounded-xl text-xs text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-200" placeholder="••••••••" />
                  </div>
                </div>

                <div className="w-full pt-1">
                  <div className="flex items-center space-x-2">
                    <input id="terms" name="terms" type="checkbox" required className="h-4 w-4 text-blue-600 border-gray-300 rounded" />
                    <label htmlFor="terms" className="block text-xs text-gray-900 lowercase">
                      i agree to the <a href="#" className="font-medium text-blue-600 hover:text-blue-700">terms & conditions</a>
                    </label>
                  </div>
                </div>

                <div className="flex gap-3 justify-end w-full pt-2">
                  <button type="button" onClick={() => setStep(1)} className="px-5 py-2.5 border border-gray-300 rounded-full text-xs font-semibold text-gray-700 bg-white hover:bg-gray-50 transition lowercase">
                    back
                  </button>
                  <button type="submit" disabled={loading} className="px-6 py-2.5 rounded-full text-xs font-semibold text-white bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 transition disabled:opacity-50 lowercase">
                    {loading ? "registering..." : "complete registration"}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Login Link */}
          <div className="w-full text-center pt-3 border-t border-gray-100 mt-4 flex-shrink-0">
            <p className="text-xs text-slate-500 lowercase">
              have an account?{" "}
              <Link to="/login" className="ml-1 text-blue-600 font-bold hover:text-blue-800 transition lowercase">
                login
              </Link>
            </p>
          </div>
        </form>

      </div>
    </div>
  );
};

export default Register;