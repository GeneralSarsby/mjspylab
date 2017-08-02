"""                        Generic data acquisition code.
                               ===  USER CODE  ===
      Author: MJS             Date: 2017-04-13                 Version: 0_0_4

This is written on top of the qtlab code and could not be done without it.
Much of the hard work has already been done, this just provides a nice
interface.

"""
import numpy as np
import mjspylab
reload(mjspylab) #testing only
import math,json,codecs,datetime,qt,sys,time

#make a dictionary of all the devices used.
devices = {'lockin1': qt.instruments.get('lockin1')
           #'keithley1': qt.instruments.get('keithley1'),
           #'keithley2': qt.instruments.get('keithley2'),
           #'keithley3': qt.instruments.get('keithley3'),
           #'magnet': qt.instruments.get('magnet'),
           #'Zmagnet' :  qt.instruments.get('Zmagnet')
           #'ivvi': qt.instruments.get('ivvi')
}

# which folder to save data too
data_folder = 'D:\\microkelvin\\test\\data\\'

# describe this data file with words and sentences
description = """Measuring the Big Frossati line filters using a lock in amplifier.
With a 50Ohm terminator on lockin input A.
"""

# use this to save structured data about the experiment
attributes = {'sample': 'DY105', # the sample number
         'title'      :'IV curve of thing', #a title for this data set
         'subtitle'   :'', # extra bit of infomation
         'series'     :'CBT development', # a series of measurements as part of a group.
         'tags'       :['iv','gate_sweep'], #keywords for searching for files later , gate_sweep iv_sweep
         'author'     :'',
         'copyright'  : 'unknown',
         'fridge'     :'Big Frossati', # What fridge it is being measured in
         'description':description,
         'fabricator' :'n/a', # people who made it
         'operator'   : 'MJS', # people measuring it
        # save other data that is relivant for you!
        # connection lines? orientation? 
        
        }



# save the state of the ivvi rack. unfotunatally this is all done by hand.
attributes['ivvi rack'] = {}
    
#this is a list of dictionaries describing what will change during the experiment.
# typically these are just the ivvi dacs or lockin amplitude, or frequencies.
# This can be as many devices as you want.
# The dictionaries are only the coordinate name followed by an array of the values. 
# The aquisition code will loop through all possible combinations for n-degrees of freedom.
# (you don't have to write nested for loops)
coordinates=[
            #{'name':'Repeats','range':[1,2]},
            {'name':'Frequency / Hz','range':np.linspace(1000,10000,30)},
            {'name':'Amplitude / V','range':np.linspace(0.004,0.1,10)},
            
            #{'name':'IVVI Dac2 / mV','range':np.linspace(-1000,1000,30)},
            #{'name':'IVVI Dac1 / mV','range':np.linspace(-1000,1000,30)},
             ]



             
# common things to change are the Dacs and frequencys and amplitudes.

# ranges are usually
# [1,2,3] # just type it by hand
# np.linspace(100,200,50) from 100 to 200 with 50 datapoints (inclusive of the endpoints)
# build complex arrays like np.append(np.linspace(100,200,50),np.linspace(200,100,50))
# which goes up and then down again.
             
# change the  three functions to do what you want.


# do stuff before the running the aquisition loop..
# this can set up the gates in a particular way
# we can also read in auxrilary files and return a dict to save useful enviromental
#values like the fridge temperature.

def setupFunction():
    #devices['ivvi'].set_dacs_zero()
    #devices['magnet'].set_field(0)
    #devices['lockin1'].set_amplitude(0)
    
    #devices['keithley3'].set_amplitude(0)
    #return a dict of things. the things can be other dicts too... 
    return {}

# coordinates is a dict of the coordinates for this current measurment.
# if you set 'IVVI Dac 2 / mV' as a range [100,200,300] then you can expect
# for example coordinates['IVVI Dac 2 / mV'] as 200 in one loop.
# it is up to you to decide what to do with the coordinates.
# save anything you want into the results dictionary including
# calculated values and measured values, raw values and values with gain applied
# data is cheap, save everything relivant.

def acqFunction(coordinates,results,prev_coordinates,prev_result,user_storage):
    'change the coordinates'
    
    #coordinates['IVVI Dac 2 / mV']
    
    #if prev_result is not None:
        #do something using the prev result, maybe this is an optimisation?
        # this is the dictionary returned from the last loop itteration
    #    pass
    #devices['ivvi'].set_dac2(coordinates['IVVI Dac2 / mV'])
    #if prev_coordinates['IVVI Dac2 / mV'] != coordinates['IVVI Dac2 / mV']:
    #    devices['ivvi'].set_dac1( -2000   )
    #    devices['ivvi'].set_dac2( coordinates['IVVI Dac2 / mV']   )
    #    time.sleep(0.1)
    
    #devices['ivvi'].set_dac1( coordinates['IVVI Dac1 / mV']   )
    
    
    #devices['ivvi'].set_dac3(coordinates['IVVI Dac3 / mV'])
    
    devices['lockin1'].set_frequency(coordinates['Frequency / Hz'])
    devices['lockin1'].set_amplitude(coordinates['Amplitude / V'])
    
    results['Measured output amplitude'] = devices['lockin1'].get_amplitude()
    #output_current = coordinates[0]*1e-3/1e6
    #results['Output Current / Amps'] = devices['ivvi'].get_dac2()*1e-3/1e6
    
    #only change something if it needs chainging: for the magnets
    # this can speed up things a lot!
    #if prev_coordinates['Zmagnet / T'] != coordinates['Zmagnet / T']:
    #    pass
        #devices['Zmagnet'].set_field(coordinates['Zmagnet / T'])
        #time.sleep(5)
    
    time.sleep(3)
    #could use discovery if too lazy to write it yourself.
    if 'kiethley1' in devices:
        results['kiethley1 / V'] = devices['kiethley1'].get_readnextval()
    
    #k2 = devices['kiethley2'].get_readnextval()
    #k3 = devices['kiethley3'].get_readnextval()
    #k4 = devices['kiethley4'].get_readnextval()
    
    #l1_f = devices['lockin1'].get_frequency()
    #l1_X = devices['lockin1'].get_X()
    #l1_Y = devices['lockin1'].get_Y()
    #l1_R = devices['lockin1'].get_R()
    #l1_P = devices['lockin1'].get_P()

    #r['Current'] =  devices['kiethley1'].get_readnextval()
    #r['Voltage'] =  devices['kiethley2'].get_readnextval()
    results['Vx / Volts'] = devices['lockin1'].get_X()
    results['Vy / Volts'] = devices['lockin1'].get_Y()
    results['V mag / Volts'] = devices['lockin1'].get_R()
    results['Phase '] = devices['lockin1'].get_P()
    #results['Output Amplitude '] = devices['lockin1'].get_P()

    results['Datetime'] = datetime.datetime.utcnow().isoformat()+'Z'
    
    return True # keep going or stop early.

# the reset function is called last to reset everything back to a good state.
def resetFunction():
    #devices['ivvi'].set_dacs_zero()
    #devices['magnet'].set_field(0)
    #devices['lockin1'].set_amplitude(0)
    return {}


#you are done setting up
# below is faff.


#returns a dictionary that is the same as the saved JSON
result = mjspylab.aquireData(devices=devices,
                  coordinates=coordinates,
                  acqFunction=acqFunction, # inside the main loop
                  resetFunction=resetFunction,
                  setupFunction=setupFunction,
                  data_folder = data_folder,
                  save_backwards_compatable_files = True,
                  save_self_script = False,
                  show_live_plot = True,
                  attributes=attributes # the attributes and metadata.
                )




